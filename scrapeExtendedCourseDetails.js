// A script that uses Cheerio to scrape course evaluation information from the Registrar
// At the moment this script does not save the data anywhere

// Load external dependencies
var http = require('https')
var cheerio = require('cheerio')
var prompt = require('prompt')

// Load config variables from the .env file
require('dotenv').config()

// Load internal modules
var courseModel = require('./course.js')
require('./semester.js')
require('./database.js')

// Load a request from the server and call the function externalCallback
var loadPage = function (term, courseID, externalCallback) {
  // Define the HTTP request options
  var options = {
    host: 'registrar.princeton.edu',
    path: '/course-offerings/course_details.xml?' + 'term=' + term + '&courseid=' + courseID
  }

  // Make the request
  var req = http.request(options, function (res) {
    var str = ''

    // Append received data to already received data
    res.on('data', function (chunk) {
      str += chunk
    })

    // Handle data once it has all been received
    res.on('end', function () {
      externalCallback(str)
    })
  })
  req.end()
}

var extractSingle = function ($, container, title) {
  var inside
  var lines = container.first().contents().filter(function () {
    if ($(this).is('strong')) {
      inside = $(this).text().indexOf(title) > -1
    }
    return (this.nodeType === 3 && inside)
  }).text().split('\n')
  for (var lineIndex in lines) {
    var line = lines[lineIndex].trim()
    if (line.length > 1 && line.substring(line.length - 2) === '..') {
      line = line.substring(0, line.length - 1)
    }
    if (line.length > 0) {
      return line
    }
  }
}

// Return the course evaluation data for the given semester/courseID to the function callback
var getCourseListingData = function (semester, courseID, callback) {
  try {
    loadPage(semester, courseID, function (data) {
      console.log('\tRecieved data for course %s in semester %s.', courseID, semester)

            // Prepare to Extract Data From Page
      var $ = cheerio.load(data)
      var results = {}
      var detailsContainer = $('#timetable')

            // Get Distrubution Area
      const regex = /\((LA|SA|HA|EM|EC|QR|STN|STL)\)/
      let m
      if ((m = regex.exec(detailsContainer.text())) !== null) {
        results.distribution = m[0].substring(1, m[0].length - 1)
      }

      var attributes = detailsContainer.find('em').first().text()

            // Get PDF Status
      results.pdf = {
        required: (attributes.indexOf('Audit') > -1),
        permitted: (attributes.indexOf('P/D/F') > -1)
      }

      // Get Audit Status
      results.audit = (attributes.indexOf('Audit') > -1)

      // Get Assignments
      var assignments = extractSingle($, detailsContainer, 'Reading/Writing assignments')
      if (typeof (assignments) !== 'undefined') {
        results.assignments = assignments
      }

            // Get Grading Components
      var insideGrading
      var gradingComponentsRaw = detailsContainer.first().contents().filter(function () {
        if ($(this).is('strong, b')) {
          insideGrading = $(this).text().indexOf('Requirements/Grading') > -1
        }
        return (this.nodeType === 3 && insideGrading)
      }).text()
      var gradingComponentLines = gradingComponentsRaw.split('\n')
      results.grading = []
      for (var gradingComponentLinesIndex in gradingComponentLines) {
        var thisGradingComponentLine = gradingComponentLines[gradingComponentLinesIndex].trim()
        if (thisGradingComponentLine.length > 0) {
          var thisGradingComponent = thisGradingComponentLine.split('-')
          results.grading.push({
            component: thisGradingComponent[0].trim(),
            weight: parseInt(thisGradingComponent[1].trim())
          })
        }
      }

            // Get Prerequisites
      var prerequisites = extractSingle($, detailsContainer, 'Prerequisites and Restrictions')
      if (typeof (prerequisites) !== 'undefined') {
        results.prerequisites = prerequisites
      }

            // Get Equivalent Courses
      var equivalentcourses = extractSingle($, detailsContainer, 'Equivalent Courses')
      if (typeof (equivalentcourses) !== 'undefined') {
        results.equivalentcourses = equivalentcourses
      }

            // Get Other Information
      var otherinformation = extractSingle($, detailsContainer, 'Other information')
      if (typeof (otherinformation) !== 'undefined') {
        results.otherinformation = otherinformation
      }

            // Get Other Requirements
      var otherrequirements = extractSingle($, detailsContainer, 'Other Requirements')
      if (typeof (otherrequirements) !== 'undefined') {
        results.otherrequirements = otherrequirements
      }

            // Get Website
      var website = detailsContainer.find('strong:contains(Website)').next('a').attr('href')
      if (typeof (website) !== 'undefined') {
        results.website = website
      }

      callback(results)
    })
  } catch (err) {

  }
}

// Find an array of courses and populate the courses with the course evaluation information from the Registrar. Save the data to the database
courseModel.find({audit: {$exists: false}}, function (error, courses) {
  if (error) {
    console.log(error)
  }

  // Check that the user is aware of the number of requests they are about to send
  console.log('You are about to request the extended course details for %d courses.', courses.length)
  prompt.start()
  prompt.get({name: 'confirmation', description: 'Are you sure you want to do this? (y/n)'}, function (err, result) {
    if (err) {
      console.log(err)
    }
    if (result.confirmation === 'y') {
      var coursesPendingProcessing = courses.length
      var courseIndex = 0

      // Every 200ms, request the details for another course
      // (We must stagger our requests to avoid overloading the Registrar's server)
      var interval = setInterval(function () {
        var thisCourse = courses[courseIndex++]

            // If there are no more courses, cease sending requests
        if (typeof (thisCourse) === 'undefined') {
          clearInterval(interval)
          return
        }

        console.log('Processing course %s in semester %d. (Course %d of %d).', thisCourse.courseID, thisCourse.semester.code, courseIndex, courses.length)

        // Fetch the evaluation data
        getCourseListingData(thisCourse.semester.code, thisCourse.courseID, function (courseData) {
          for (var index in courseData) {
            thisCourse[index] = courseData[index]
          }

          thisCourse.save(function (error) {
            if (error) {
              console.log(error)
            }
            coursesPendingProcessing--
            // Quit if there are no more courses pending processing
            if (coursesPendingProcessing <= 1) {
              console.log('Fetched and saved all the requested extended course details.')
              process.exit(0)
            }
          })
        })
      }, 200)
    } else {
      process.exit(0)
    }
  })
})
