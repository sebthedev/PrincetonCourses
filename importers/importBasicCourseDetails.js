// This script populates the database with all the courses from MobileApp API and Princeton's Registrar
console.log('Starting script to update our database with latest course listings information from MobileApp API and the Registrar.')

// Load config variables from the .env file
require('dotenv').config()

// Load external dependencies
const log = require('loglevel')
const cheerio = require('cheerio')
const mongoose = require('mongoose')
const spawn = require('child_process').spawn

// Set the level of the logger to the first command line argument
// Valid values: "trace", "debug", "info", "warn", "error"
if (process.argv.length > 3) {
  log.setLevel(process.argv[3])
}

// Load internal modules
var semesterModel = require('../models/semester.js')
var courseModel = require('../models/course.js')

// Connect to the database
require('../controllers/database.js')

// This is the mapping from assignment keys to their proper titles.
// Labels follow the registrar's current wording (checked Nov 2026 against
// URB 385 Fall 2026 on the registrar's course page).
const assignmentMapping = {
  'grading_mid_exam': 'Mid term exam',
  'grading_paper_mid_exam': 'Paper in lieu of mid term',
  'grading_final_exam': 'Final exam',
  'grading_paper_final_exam': 'Final paper, problem set, or project',
  'grading_other_exam': 'Other exam',
  'grading_home_mid_exam': 'Take home mid term exam',
  'grading_design_projects': 'Design project',
  'grading_home_final_exam': 'Take home final exam',
  'grading_prog_assign': 'Programming assignments',
  'grading_quizzes': 'Quizzes',
  'grading_lab_reports': 'Lab reports',
  'grading_papers': 'Papers/writing assignments',
  'grading_oral_pres': 'Oral presentation(s)',
  'grading_term_papers': 'Term paper(s)',
  'grading_precept_part': 'Participation',
  'grading_prob_sets': 'Problem set(s)',
  'grading_other': 'Other (see instructor)'
}

// Grading categories the registrar sends that are not in assignmentMapping.
// They are still shown (with a label made from the field name) and listed at
// the end of the import so a proper label can be added above.
const unmappedGradingKeys = new Set()

// Every registrar field "grading_<something>" is a weight, except these.
const nonWeightGradingKeys = new Set(['grading_basis'])

// "grading_group_proj" -> "Group proj"
const gradingLabel = function (key) {
  if (assignmentMapping[key]) return assignmentMapping[key]
  unmappedGradingKeys.add(key)
  const words = key.replace(/^grading_/, '').split('_').filter(Boolean).join(' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}

// This is how we keep track of the token that is required for accessing api.princeton.edu
let registrarFrontEndAPIToken
// Set once the registrar rejects the token (401/403) so remaining courses skip enrichment.
let registrarTokenRejected = false
let enrichedCount = 0
let unenrichedCount = 0

// Simple throttle: allows at most `maxRequests` concurrent fetches
const createThrottle = function (maxRequests) {
  let active = 0
  const queue = []
  const next = function () {
    if (queue.length === 0 || active >= maxRequests) return
    active++
    const { url, options, resolve, reject } = queue.shift()
    fetch(url, options).then(resolve).catch(reject).finally(function () {
      active--
      next()
    })
  }
  return function throttledFetch (url, options) {
    return new Promise(function (resolve, reject) {
      queue.push({ url, options, resolve, reject })
      next()
    })
  }
}

const throttledFetch = createThrottle(5)

// A function that takes a query string for the OIT's Course Offerings API and return to the
// external callback junction a JSON object of the response data.
// For example, the query "term=1174&subject=COS" will return all COS courses in
// the Spring 2017 semester. Learn about valid query strings at https://webfeeds.princeton.edu/#feed,19
var loadCoursesFromRegistrar = function (query, externalCallback) {
  console.log('Preparing to make request to MobileApp API for course listings data')

  let args = ['importers/mobileapp.py', 'importBasicCourseDetails']
  if (query.length > 0) {
    args.push(query)
  }
  const pythonMobileAppManager = spawn('python', args)
  var res = ''
  pythonMobileAppManager.stdout.on('data', function (data) {
    res += data.toString('utf8')
  })
  pythonMobileAppManager.stdout.on('end', function () {
    Promise.resolve().then(function () {
      return externalCallback(JSON.parse(res))
    }).catch(function (error) {
      console.log(error)
      process.exit(1)
    })
  })
  pythonMobileAppManager.on('error', function (error) {
    console.log(error)
  })
}

var importDataFromRegistrar = async function (data) {
  console.log('Processing data recieved from MobileApp API.')
  for (var termIndex in data.term) {
    data.term[termIndex].code = Number(data.term[termIndex].code)
  }

  for (var termIndex in data.term) {
    var term = data.term[termIndex]
    await importTerm(term)
  }

  console.log('All courses successfully processed. Registrar enrichment: %d enriched, %d saved from OIT data only.', enrichedCount, unenrichedCount)
  if (unmappedGradingKeys.size > 0) {
    console.warn('Grading categories with no label in assignmentMapping (shown with a generated label): %s', Array.from(unmappedGradingKeys).sort().join(', '))
  }
  if (unenrichedCount > 0 && enrichedCount === 0) {
    console.warn('No course received registrar enrichment this run. Provide a valid REGISTRAR_FE_API_TOKEN (from a browser session on registrar.princeton.edu/course-offerings) and re-run to fill grading, reserved seats, prerequisites, and reading lists.')
  }

  try {
    await mongoose.connection.close()
  } catch (error) {
    console.log(error)
  }

  process.exit(0)
}

// Recieve a "term" of data (of the kind produced by MobileApp API) and add/update the database to contain this data
var importTerm = async function (term) {
  console.log('Processing the %s semester.', term.cal_name)

  try {
    var semester = await semesterModel.findOneAndUpdate({
      _id: term.code
    }, {
      _id: term.code,
      name: term.cal_name,
      start_date: term.start_date,
      end_date: term.end_date
    }, {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true
    })
    log.trace('Creating or updating the semester %s succeeded.', term.cal_name)

    // Process each subject within this semester
    const pendingCourseImports = []
    for (var subjectIndex in term.subjects) {
      var subject = term.subjects[subjectIndex]
      pendingCourseImports.push(...importSubject(semester, subject))
    }

    console.log('Queued %d course detail requests for the %s semester.', pendingCourseImports.length, term.cal_name)

    const importResults = await Promise.allSettled(pendingCourseImports)
    const failedImports = importResults.filter(function (result) {
      return result.status === 'rejected'
    })

    if (failedImports.length > 0) {
      console.warn('Failed to process %d courses in the %s semester.', failedImports.length, term.cal_name)
      failedImports.slice(0, 5).forEach(function (result) {
        console.warn(result.reason)
      })
    }
  } catch (error) {
    log.warn('Creating or updating the semester %s failed.', term.cal_name)
  }
}

// Decode escaped HTML characters in a string, for example changing "Foo&amp;bar" to "Foo&bar"
var decodeEscapedCharacters = function (html) {
  return cheerio.load('<div>' + cheerio.load('<div>' + html + '</div>').text() + '</div>').text()
}

// Enrich courseData in place with registrar front-end API details.
// Returns true when enrichment succeeded, false otherwise (the caller still
// saves the course from OIT data either way).
var enrichCourseFromRegistrar = async function (semester, courseData) {
  const requestUrl = `https://api.princeton.edu/registrar/course-offerings/course-details?term=${semester._id}&course_id=${courseData.course_id}`
  const requestHeaders = {
    Pragma: 'no-cache',
    Accept: 'application/json',
    Authorization: `Bearer ${registrarFrontEndAPIToken}`,
    'User-Agent': 'Princeton Courses (https://www.princetoncourses.com)'
  }

  try {
    var response = await throttledFetch(requestUrl, { headers: requestHeaders })
  } catch (error) {
    console.warn(`Registrar details request failed for ${courseData.course_id}: ${error.message}`)
    return false
  }

  console.log(`Got results for ${courseData.course_id}`)

  // Ensure valid response shape from registrar API
  if (response && (response.status === 401 || response.status === 403)) {
    if (!registrarTokenRejected) {
      console.warn(`Registrar rejected the front-end API token (HTTP ${response.status}); skipping registrar enrichment for the remaining courses.`)
    }
    registrarTokenRejected = true
    return false
  }
  if (!response || response.status !== 200) {
    console.warn(`Skipping ${courseData.course_id}: registrar responded with status ${response && response.status}`)
    return false
  }

  let parsed
  try {
    parsed = await response.json()
  } catch (e) {
    console.warn(`Skipping ${courseData.course_id}: failed to parse registrar JSON (${e.message})`)
    return false
  }

  const detailsRoot = parsed && parsed.course_details
  const detailsArr = detailsRoot && detailsRoot.course_detail
  if (!Array.isArray(detailsArr) || detailsArr.length === 0) {
    console.warn(`Skipping ${courseData.course_id}: no course_detail found in registrar response`)
    return false
  }

  let frontEndApiCourseDetails = detailsArr[0]

  // Grading Basis
  switch (frontEndApiCourseDetails.grading_basis) {
    case 'FUL': // Graded A-F, P/D/F, Audit
      courseData.pdf = { required: false, permitted: true }
      courseData.audit = true
      break
    case 'NAU': // No Audit
      courseData.pdf = { required: false, permitted: true }
      courseData.audit = false
      break
    case 'GRD': // na, npdf
      courseData.pdf = { required: false, permitted: false }
      courseData.audit = false
      break
    case 'NPD': // No Pass/D/Fail
      courseData.pdf = { required: false, permitted: false }
      courseData.audit = true
      break
    case 'PDF': // P/D/F Only
      courseData.pdf = { required: true, permitted: true }
      courseData.audit = true
      break
    default:
      courseData.pdf = { required: false, permitted: true }
      courseData.audit = true
  }

  // Get Grading
  // Take every grading_* weight, not only those named in assignmentMapping:
  // the registrar has added categories, and a fixed list silently dropped
  // them (breakdowns adding up to 55% or 85%). Weights may arrive as "25",
  // 25, "25.00", "0", 0, "", or null; keep only real, positive percentages.
  courseData.grading = Object.keys(frontEndApiCourseDetails).filter(function (key) {
    return key.startsWith('grading_') && !nonWeightGradingKeys.has(key)
  }).map(function (key) {
    return {
      key: key,
      weight: parseFloat(frontEndApiCourseDetails[key])
    }
  }).filter(function (grade) {
    return Number.isFinite(grade.weight) && grade.weight > 0
  }).map(function (grade) {
    return { component: gradingLabel(grade.key), weight: grade.weight }
  }).sort(function (a, b) {
    if (a.weight < b.weight) return 1
    if (a.weight > b.weight) return -1
    return 0
  })

  // Get assignments description
  if (frontEndApiCourseDetails.reading_writing_assignment && frontEndApiCourseDetails.reading_writing_assignment.trim().length > 0) {
    courseData.assignments = frontEndApiCourseDetails.reading_writing_assignment.trim()
  }

  // Get reserved seats
  if (frontEndApiCourseDetails.seat_reservations.seat_reservation) {
    courseData.reservedSeats = frontEndApiCourseDetails.seat_reservations.seat_reservation.map(function (reservation) {
      return `${reservation.description} ${reservation.enrl_cap}`
    })
  }

  // Get reading list
  let readingList = []
  for (let i = 1; i <= 6; i++) {
    let title = frontEndApiCourseDetails[`reading_list_title_${i}`]
    if (title && title.trim().length > 0) {
      let reading = { title: title.trim() }
      let author = frontEndApiCourseDetails[`reading_list_author_${i}`]
      if (author && author.trim().length > 0) {
        reading.author = author.trim()
      }
      readingList.push(reading)
    }
  }
  if (readingList.length > 0) {
    courseData.readingList = readingList
  }

  // Get prerequisites and restrictions
  courseData.prerequisites = frontEndApiCourseDetails.other_restrictions

  // Get other information
  courseData.otherinformation = frontEndApiCourseDetails.other_information

  // Get other requirements
  courseData.otherrequirements = frontEndApiCourseDetails.other_requirements

  // Get website
  courseData.website = frontEndApiCourseDetails.web_address

  // Get distribution requirements
  courseData.distribution_area = frontEndApiCourseDetails.distribution_area_short
  return true
}

var importCourse = async function (semester, subjectCode, courseData) {
  if (typeof (courseData.catalog_number) === 'undefined' || courseData.catalog_number.length < 2) {
    return
  }

  // Decode escaped HTML characters in the course title
  if (typeof (courseData.title) !== 'undefined') {
    courseData.title = decodeEscapedCharacters(courseData.title)
  }

  // Decode escaped HTML characters in the course description
  if (typeof (courseData.detail.description) !== 'undefined') {
    courseData.detail.description = decodeEscapedCharacters(courseData.detail.description)
  }

  if (registrarFrontEndAPIToken && !registrarTokenRejected) {
    try {
      if (await enrichCourseFromRegistrar(semester, courseData)) {
        enrichedCount++
      } else {
        unenrichedCount++
      }
    } catch (error) {
      console.warn(`Registrar enrichment threw for ${courseData.course_id}: ${error.message}`)
      unenrichedCount++
    }
  } else {
    unenrichedCount++
  }

  await courseModel.createCourse(semester, subjectCode, courseData)
}

var importSubject = function (semester, subject) {
  log.debug('Processing the subject %s in the %s semester.', subject.code, semester.name)
  const pendingCourseImports = []

  // Iterate over the courses in this subject
  for (var courseIndex in subject.courses) {
    const courseData = subject.courses[courseIndex]
    pendingCourseImports.push(importCourse(semester, subject.code, courseData))
  }

  return pendingCourseImports
}

// Get queryString from command line args
var queryString = ''
if (process.argv.length > 2) {
  queryString = process.argv[2]
}

const getRegistrarFrontEndAPIToken = async function () {
  if (process.env.REGISTRAR_FE_API_TOKEN && process.env.REGISTRAR_FE_API_TOKEN.trim().length > 0) {
    return process.env.REGISTRAR_FE_API_TOKEN.trim()
  }
  var response = await fetch('https://registrar.princeton.edu/course-offerings')
  var body = await response.text()
  const $ = cheerio.load(body)
  let tokenText = ''
  const el = $('[data-drupal-selector="drupal-settings-json"]')
  if (el && el.length > 0) {
    tokenText = el.text() || ''
  }
  let token = ''
  if (tokenText && tokenText.trim().length > 0) {
    try {
      const obj = JSON.parse(tokenText)
      if (obj && obj.ps_registrar && obj.ps_registrar.apiToken) {
        token = obj.ps_registrar.apiToken
      }
    } catch (e) {
      // fallthrough to regex scan
    }
  }
  if (!token) {
    // Attempt regex search through all scripts as a fallback
    $('script').each(function (i, s) {
      if (token) return
      const txt = $(s).html() || ''
      const m = txt.match(/"apiToken"\s*:\s*"([^"]+)"/)
      if (m && m[1]) {
        token = m[1]
      }
    })
  }
  if (!token) {
    throw new Error('Could not locate registrar front-end API token in course-offerings page. Set REGISTRAR_FE_API_TOKEN to override.')
  }
  return token
}

console.log("Acquiring API token for the registrar's website front-end API")
getRegistrarFrontEndAPIToken().then(function (apiToken) {
  console.log('Got registrarFrontEndAPIToken')
  registrarFrontEndAPIToken = apiToken
  // Only start loading courses after token is available to avoid undefined header usage
  loadCoursesFromRegistrar(queryString, importDataFromRegistrar)
}).catch(function (error) {
  console.warn('Could not acquire registrarFrontEndAPIToken (%s). Courses will be imported from OIT data without registrar enrichment (grading, reserved seats, prerequisites, reading list). Set REGISTRAR_FE_API_TOKEN to restore enrichment.', error.message)
  registrarFrontEndAPIToken = null
  loadCoursesFromRegistrar(queryString, importDataFromRegistrar)
})
