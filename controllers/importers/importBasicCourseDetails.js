const request = require('request-promise-native')
const semesterModel = require('../../models/semester.js')
const courseModel = require('../../models/course.js')
// Load config variables from the .env file
require('dotenv').config()
require('../database.js')

const fetchCourseDataFromRegistrar = function (query) {
  console.log("Preparing to make request to the Registrar for course listings data with query '%s'.", query)

  const requestOptions = {
    url: 'https://etcweb.princeton.edu/webfeeds/courseofferings/?fmt=json&' + query,
    headers: {
      'User-Agent': 'Princeton Courses (https://www.princetoncourses.com)'
    },
    json: true
  }

  return request(requestOptions)
}

const importBasicCourseDetails = async function (query, callback) {
  // Fetch the data from the registrar
  const courseData = await fetchCourseDataFromRegistrar(query)
  console.log(courseData)

  console.log('Processing data recieved from the Registrar.')

  let semesterProcessingPromises = []

  for (const term of courseData.term) {
    console.log('Processing the %s semester.', term.cal_name)

    // Update/Add Semesters to the database
    // Existing semesters not in data object will be untouched
    // Existing semesters in data object will be updated
    // New semesters in data object will be created
    const semester = await semesterModel.findOneAndUpdate({
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

    console.log('Creating or updating the semester %s succeeded.', term.cal_name)

    // Process each subject within this semester
    let subjectProcessingPromises = []
    for (const subject of term.subjects) {
      subjectProcessingPromises.append(processSubject(semester, subject))
    }

    const thisSemesterPromise = Promise.all(subjectProcessingPromises)

    semesterProcessingPromises.append(thisSemesterPromise)
  }

  Promise.all(semesterProcessingPromises).then(function (result) {
    console.log('DONE')
    console.log(result)
    console.log('DONE')
  }).catch(function (err) {
    console.log(err)
  })
}

// Decode escaped HTML characters in a string, for example changing "Foo&amp;bar" to "Foo&bar"
var decodeEscapedCharacters = function (html) {
  return $('<div>' + $('<div>' + html + '</div>').text() + '</div>').text()
}

const processSubject = function (semester, subject) {
  console.log('Processing the subject %s in the %s semester.', subject.code, semester.name)

  let courseProcessingPromises = []
  for (const course of subject.courses) {
    console.log(course)
    const thisCoursePromise = new Promise(function (resolve, reject) {
      resolve(course.title)
    })
    courseProcessingPromises.append(thisCoursePromise)
  }
  return Promise.all(courseProcessingPromises)
}

const importSubject = function (semester, subject) {
  console.log('Processing the subject %s in the %s semester.', subject.code, semester.name)

  // Iterate over the courses in this subject
  for (const courseData of subject.courses) {
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

    courseModel.createCourse(semester, subject.code, courseData, function () {
      // Decrement the number of courses pending processing
      coursesPendingProcessing--

      // If there are no courses pending processing, we should quit
      if (coursesPendingProcessing === 0) {
        console.log('All courses successfully processed.')
        process.exit()
      }
    })
  }
}

module.exports = importBasicCourseDetails
