// This script populates the database with all the courses from MobileApp API and Princeton's Registrar
console.log('Starting script to update our database with latest course listings information from MobileApp API and the Registrar.')

// Load config variables from the .env file
require('dotenv').config()

// Load external dependencies
const log = require('loglevel')
const cheerio = require('cheerio')
const request = require('request')
const spawn = require("child_process").spawn;
const throttledRequest = require("throttled-request")(request);

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

// This is the mapping from assignment keys to their proper titles
const assignmentMapping = {
  'grading_mid_exam': 'Mid term exam',
  'grading_paper_mid_exam': 'Paper in lieu of mid term',
  'grading_final_exam': 'Final exam',
  'grading_paper_final_exam': 'Paper in lieu of final',
  'grading_other_exam': 'Other exam',
  'grading_home_mid_exam': 'Take home mid term exam',
  'grading_design_projects': 'Design project',
  'grading_home_final_exam': 'Take home final exam',
  'grading_prog_assign': 'Programming assignments',
  'grading_quizzes': 'Quizzes',
  'grading_lab_reports': 'Lab reports',
  'grading_papers': 'Papers',
  'grading_oral_pres': 'Oral presentation(s)',
  'grading_term_papers': 'Term paper(s)',
  'grading_precept_part': 'Class/precept participation',
  'grading_prob_sets': 'Problem set(s)',
  'grading_other': 'Other (see instructor)'
}
const assignmentPropertyNames = Object.keys(assignmentMapping)

// This is how we keep track of the token that is required for accessing api.princeton.edu
let registrarFrontEndAPIToken

// This will throttle web requests so no more than 5 are made every second
throttledRequest.configure({
  requests: 5,
  milliseconds: 1000
})

// A function that takes a query string for the OIT's Course Offerings API and return to the
// external callback junction a JSON object of the response data.
// For example, the query "term=1174&subject=COS" will return all COS courses in
// the Spring 2017 semester. Learn about valid query strings at https://webfeeds.princeton.edu/#feed,19
var loadCoursesFromRegistrar = function (query, externalCallback) {
  console.log("Preparing to make request to MobileApp API for course listings data");

  let args = ["importers/mobileapp.py", "importBasicCourseDetails"];
  if (query.length > 0) {
      args.push(query);
  }
  const pythonMobileAppManager = spawn("python", args);
  res = "";
  pythonMobileAppManager.stdout.on("data", (data) => {
      res += data.toString("utf8");
  });
  pythonMobileAppManager.stdout.on("end", () => {
      externalCallback(JSON.parse(res));
  });
  pythonMobileAppManager.on("error", (error) => {
      console.log(error);
  });
}

var importDataFromRegistrar = function (data) {
  console.log('Processing data recieved from MobileApp API.')
  data.term[0].code = Number(data.term[0].code);

  for (var termIndex in data.term) {
    var term = data.term[termIndex]
    importTerm(term)
  }
}

// Recieve a "term" of data (of the kind produced by MobileApp API) and add/update the database to contain this data
var importTerm = function (term) {
  console.log('Processing the %s semester.', term.cal_name)

  // Update/Add Semesters to the database
  // Existing semesters not in data object will be untouched
  // Existing semesters in data object will be updated
  // New semesters in data object will be created
  semesterModel.findOneAndUpdate({
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
  }, function (error, semester) {
    if (error) {
      log.warn('Creating or updating the semester %s failed.', term.cal_name)
    }
    log.trace('Creating or updating the semester %s succeeded.', term.cal_name)

    // Process each subject within this semester
    for (var subjectIndex in term.subjects) {
      var subject = term.subjects[subjectIndex]
      importSubject(semester, subject)
    }
  })
}

// Decode escaped HTML characters in a string, for example changing "Foo&amp;bar" to "Foo&bar"
var decodeEscapedCharacters = function (html) {
  return cheerio('<div>' + cheerio('<div>' + html + '</div>').text() + '</div>').text()
}

var importSubject = async function (semester, subject) {
  log.debug('Processing the subject %s in the %s semester.', subject.code, semester.name)

  // Iterate over the courses in this subject
  for (var courseIndex in subject.courses) {
    const courseData = subject.courses[courseIndex]

    // Print the catalog number
    //console.log('\t' + courseData.catalog_number)

    if (typeof (courseData.catalog_number) === 'undefined' || courseData.catalog_number.length < 2) {
      continue
    }

    // Decode escaped HTML characters in the course title
    if (typeof (courseData.title) !== 'undefined') {
      courseData.title = decodeEscapedCharacters(courseData.title)
    }

    // Decode escaped HTML characters in the course description
    if (typeof (courseData.detail.description) !== 'undefined') {
      courseData.detail.description = decodeEscapedCharacters(courseData.detail.description)
    }

    const requestOptions = {
      url: `https://api.princeton.edu/registrar/course-offerings/course-details?term=${semester._id}&course_id=${courseData.course_id}`,
      headers: {
        Pragma: 'no-cache',
        Accept: 'application/json',
        Authorization: `Bearer ${registrarFrontEndAPIToken}`,
        'User-Agent': 'Princeton Courses (https://www.princetoncourses.com)'
      }
    }

    // Increment the number of courses pending processing
    coursesPendingProcessing++

    throttledRequest(requestOptions, function (error, response, body) {
      if (error) {
        coursesPendingProcessing--
        return console.log(error)
      }
      console.log(`Got results for ${courseData.course_id}`)
      let frontEndApiCourseDetails
      try {
        frontEndApiCourseDetails = JSON.parse(body).course_details.course_detail[0]
      } catch (error) {
        return console.error(error)
      }

      // Grading Basis
      switch (frontEndApiCourseDetails.grading_basis) {
        case 'FUL': // Graded A-F, P/D/F, Audit
          courseData.pdf = {
            required: false,
            permitted: true
          }
          courseData.audit = true
          break
        case 'NAU': // No Audit
          courseData.pdf = {
            required: false,
            permitted: true
          }
          courseData.audit = false
          break
        case 'GRD': // na, npdf
          courseData.pdf = {
            required: false,
            permitted: false
          }
          courseData.audit = false
          break
        case 'NPD': // No Pass/D/Fail
          courseData.pdf = {
            required: false,
            permitted: false
          }
          courseData.audit = true
          break
        case 'PDF': // P/D/F Only
          courseData.pdf = {
            required: true,
            permitted: true
          }
          courseData.audit = true
          break
        default:
          courseData.pdf = {
            required: false,
            permitted: true
          }
          courseData.audit = true
      }

      // Get Grading
      courseData.grading = Object.keys(frontEndApiCourseDetails).filter(key => assignmentPropertyNames.includes(key)).filter(key => frontEndApiCourseDetails[key] !== '0').map(function (key) {
        return {
          component: assignmentMapping[key],
          weight: parseFloat(frontEndApiCourseDetails[key])
        }
      }).sort(function (a, b) {
        if (a.weight < b.weight) {
          return 1
        }
        if (a.weight > b.weight) {
          return -1
        }
        return 0
      })

      // Get assignments description
      if (frontEndApiCourseDetails.reading_writing_assignment && frontEndApiCourseDetails.reading_writing_assignment.trim().length > 0) {
        courseData.assignments = frontEndApiCourseDetails.reading_writing_assignment.trim()
      }

      // Get reserved seats
      if (frontEndApiCourseDetails.seat_reservations.seat_reservation) {
        courseData.reservedSeats = frontEndApiCourseDetails.seat_reservations.seat_reservation.map(reservation => `${reservation.description} ${reservation.enrl_cap}`)
      }

      // Get reading list
      let readingList = []
      for (let i = 1; i <= 6; i++) {
        let title = frontEndApiCourseDetails[`reading_list_title_${i}`]
        if (title && title.trim().length > 0) {
          let reading = {
            title: title.trim()
          }

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

      // Get other information
      courseData.otherrequirements = frontEndApiCourseDetails.other_requirements

      // Get other information
      courseData.website = frontEndApiCourseDetails.web_address

      // Get distribution requirements
      courseData.distribution_area = frontEndApiCourseDetails.distribution_area_short

      courseModel.createCourse(semester, subject.code, courseData, function () {
        // Decrement the number of courses pending processing
        coursesPendingProcessing--

        // If there are no courses pending processing, we should quit
        if (coursesPendingProcessing === 0) {
          console.log('All courses successfully processed.')
          process.exit()
        }
      })
    })
  }
}

// Initialise a counter of the number of courses pending being added to the database
var coursesPendingProcessing = 0

// Get queryString from command line args
var queryString = "";
if (process.argv.length > 2) {
  queryString = process.argv[2]
}

const getRegistrarFrontEndAPIToken = function (callback) {
  request('https://registrar.princeton.edu/course-offerings', function (error, response, body) {
    if (error) {
      return callback(error)
    }

    const $ = cheerio.load(body)
    const registrarFrontEndAPIToken = JSON.parse($('[data-drupal-selector="drupal-settings-json"]').text()).ps_registrar.apiToken
    callback(null, registrarFrontEndAPIToken)
  })
}

console.log("Acquiring API token for the registrar's website front-end API")

getRegistrarFrontEndAPIToken(function (error, apiToken) {
  if (error) {
    console.log('Failed getting registrarFrontEndAPIToken')
    return console.log(error)
  }
  console.log('Got registrarFrontEndAPIToken')
  registrarFrontEndAPIToken = apiToken
})

// Execute a script to import courses from all available semesters ("terms") and all available departments ("subjects")
loadCoursesFromRegistrar(queryString, importDataFromRegistrar)
