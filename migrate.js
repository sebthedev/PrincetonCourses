// This script populates the database with all the courses from Princeton's Registrar

console.log('Starting script to update our database with latest course listings information from the Registrar.')

// Load config variables from the .env file
require('dotenv').config()

// Load external dependencies
var http = require('http')
var log = require('loglevel')
// var mongoose = require('mongoose')

// Set the level of the logger to the first command line argument
// Valid values: "trace", "debug", "info", "warn", "error"
if (process.argv.length > 2) {
  log.setLevel(process.argv[2])
}

// Load internal models
var semesterModel = require('./semester.js')
var courseModel = require('./course.js')

// Connect to the database
require('./database.js')

// A function that takes a query string for the OIT's Course Offerings API and return to the
// external callback junction a JSON object of the response data.
// For example, the query "term=1174&subject=COS" will return all COS courses in
// the Spring 2017 semester. Learn about valid query strings at https://webfeeds.princeton.edu/#feed,19
var loadCoursesFromRegistrar = function (query, externalCallback) {
  log.debug("Preparing to make request to the Registrar for course listings data with query '%s'.", query)

    // Define the HTTP request options
  var options = {
    host: 'etcweb.princeton.edu',
    path: '/webfeeds/courseofferings/?fmt=json&' + query
  }

    // Make the request
  var req = http.request(options, function (res) {
    log.debug('Request sent to the Registrar.')

    var str = ''

        // Append received data to already received data
    res.on('data', function (chunk) {
      str += chunk
    })

        // Handle data once it has all been received
    res.on('end', function () {
      log.info('Course listings data recieved from the Registrar.')
      var data = JSON.parse(str)
      externalCallback(data)
    })
  })
  req.end()
}

var processDataFromRegistrar = function (data) {
  log.info('Processing data recieved from the Registrar.')

  for (var termIndex in data.term) {
    var term = data.term[termIndex]
    processTerm(term)
  }
}

// Recieve a "term" of data (of the kind produced by the Registrar) and add/update the database to contain this data
var processTerm = function (term) {
    // Update/Add Semesters to the database
    // Existing semesters not in data object will be untouched
    // Existing semesters in data object will be updated
    // New semesters in data object will be created
  semesterModel.findOneAndUpdate({
    _id: term.code
  }, {
    _id: term.code,
    code: term.code,
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
      processSubject(semester, subject)
    }
  })
}

var processSubject = function (semester, subject) {
  for (var courseIndex in subject.courses) {
    var courseData = subject.courses[courseIndex]
        // console.log(courseData);
        // process.exit(0);
    courseModel.createCourse(semester, subject.code, courseData)
  }
}

loadCoursesFromRegistrar('term=all&subject=AAS', processDataFromRegistrar)

courseModel.findCourse('AAS', 372, function (thisCourse) {
    // console.log(thisCourse);
    // console.log("Retrieved this course with semester %d", thisCourse.semester);
})
