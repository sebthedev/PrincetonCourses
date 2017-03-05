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

// Load internal modules
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

var importDataFromRegistrar = function (data) {
  log.info('Processing data recieved from the Registrar.')

  for (var termIndex in data.term) {
    var term = data.term[termIndex]
    importTerm(term)
  }
}

// Recieve a "term" of data (of the kind produced by the Registrar) and add/update the database to contain this data
var importTerm = function (term) {
  log.info('Processing the %s semester.', term.cal_name)

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
      importSubject(semester, subject)
    }
  })
}

var importSubject = function (semester, subject) {
  log.debug('Processing the subject %s in the %s semester.', subject.code, semester.name)

  // Iterate over the courses in this subject
  for (var courseIndex in subject.courses) {
    var courseData = subject.courses[courseIndex]

    // Print the catalog number
    if (log.getLevel() < 1) {
      process.stdout.write(' ' + courseData.catalog_number)
    }

    // Increment the number of courses pending processing
    coursesPendingProcessing++

    courseModel.createCourse(semester, subject.code, courseData, function () {
      // Decrement the number of courses pending processing
      coursesPendingProcessing--

      // If there are no courses pending processing, we should quit
      if (coursesPendingProcessing === 0) {
        log.info('All courses successfully processed.')
        process.exit()
      }
    })
  }

  // Print a newline
  if (log.getLevel() < 1) {
    process.stdout.write('\n')
  }
}

// Initialise a counter of the number of courses pending being added to the database
var coursesPendingProcessing = 0

// Execute a script to import courses from all available semesters ("terms") and all available departments ("subjects")
loadCoursesFromRegistrar('term=all&subject=all', importDataFromRegistrar)
