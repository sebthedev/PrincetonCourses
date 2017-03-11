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
    host: 'reg-captiva.princeton.edu',
    path: '/chart/index.php?' + 'terminfo=' + term + '&courseinfo=' + courseID
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

// Return the course evaluation data for the given semester/courseID to the function callback
var getCourseEvaluationData = function (semester, courseID, callback) {
  loadPage(semester, courseID, function (data) {
    var $ = cheerio.load(data)

    console.log('\tRecieved data for course %s in semester %s.', courseID, semester)

    var evaluations = {}

    // Get Chart Data
    var b64EncodedChartData = $('#chart_settings').attr('value')
    if (b64EncodedChartData) {
      evaluations.scores = {}
      var chartData = Buffer.from(b64EncodedChartData, 'base64').toString('ascii')
      var chart = JSON.parse(chartData)

      // Extract Numerical Evaluation Data from Chart
      var xItems = chart.PlotArea.XAxis.Items
      var yItems = chart.PlotArea.ListOfSeries[0].Items
      for (var itemIndex in chart.PlotArea.XAxis.Items) {
        evaluations.scores[xItems[itemIndex].Text] = parseFloat(yItems[itemIndex].YValue)
      }
    }

    // Extract student comments
    var studentComments = []
    $('table:last-child tr:not(:first-child) td').each(function (index, element) {
      studentComments.push($(element).text())
    })
    if (studentComments.length > 0) {
      evaluations.studentComments = studentComments
    }

    callback(evaluations)
  })
}

// Find an array of courses and populate the courses with the course evaluation information from the Registrar. Save the data to the database
courseModel.find({}, function (error, courses) {
  if (error) {
    console.log(error)
  }

  // Check that the user is aware of the number of requests they are about to send
  console.log('You are about to request the course evaluation data for %d courses.', courses.length)
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

        console.log('Processing course %d in semester %d. (Course %d of %d).', thisCourse.courseID, thisCourse.semester.code, courseIndex, courses.length)

        // Fetch the evaluation data
        getCourseEvaluationData(thisCourse.semester.code, thisCourse.courseID, function (courseEvaluationData) {
          coursesPendingProcessing--

          // Save the evaluation data (if it exists)
          if (Object.keys(courseEvaluationData).length > 0) {
            thisCourse.evaluations = courseEvaluationData
            thisCourse.save(function (error) {
              if (error) {
                console.log(error)
              }

              // Quit if there are no more courses pending processing
              if (coursesPendingProcessing <= 1) {
                console.log('Fetched and saved all the requested course evaluations.')
                process.exit(0)
              }
            })
          }
        })
      }, 200)
    } else {
      process.exit(0)
    }
  })
})
