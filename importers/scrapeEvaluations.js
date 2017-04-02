// A script that uses Cheerio to scrape course evaluation information from the Registrar
// At the moment this script does not save the data anywhere

// Load external dependencies
var http = require('https')
var cheerio = require('cheerio')
var prompt = require('prompt')

// Load config variables from the .env file
require('dotenv').config({path: '../.env'})

// Load internal modules
var courseModel = require('../models/course.js')
require('../models/semester.js')
var evaluationModel = require('../models/evaluation.js')

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

    res.on('err', function (err) {
      console.log(err)
    })
  })
  req.end()
}

// Return the course evaluation data for the given semester/courseID to the function callback
var getCourseEvaluationData = function (semester, courseID, callback) {
  loadPage(semester, courseID, function (data) {
    var $ = cheerio.load(data)

    console.log('\tRecieved data for course %s in semester %s.', courseID, semester)

    // If this course is in the current semester, then the Registrar's page defaults back to the most recent semester for which course evaluations exist. This checks that we have indeed scraped the evaluations for the correct semester.
    if ($("td[bgcolor=Gainsboro] a[href*='terminfo=" + semester + "']").length !== 1) {
      callback({}, [])
      return
    }

    // Get Chart Data
    var b64EncodedChartData = $('#chart_settings').attr('value')
    var scores = {}
    if (b64EncodedChartData) {
      var chartData = Buffer.from(b64EncodedChartData, 'base64').toString('ascii')
      var chart = JSON.parse(chartData)

      // Extract Numerical Evaluation Data from Chart
      var xItems = chart.PlotArea.XAxis.Items
      var yItems = chart.PlotArea.ListOfSeries[0].Items
      for (var itemIndex in chart.PlotArea.XAxis.Items) {
        scores[xItems[itemIndex].Text] = parseFloat(yItems[itemIndex].YValue)
      }
    }

    // Extract student comments
    var comments = []
    $('table:last-child tr:not(:first-child) td').each(function (index, element) {
      comments.push($(element).text().replace('\n', ' ').replace('\r', ' ').trim())
    })

    callback(scores, comments)
  })
}

prompt.start()

prompt.get({
  name: 'query',
  description: 'Enter the MongoDB-style query for the courses for which you want to import the evaluations'
}, function (err, result) {
  if (err) {
    console.log(err)
  }

  if (result.query.length === 0) {
    result.query = '{}'
  }

  // Extract the query
  try {
    var query = JSON.parse(result.query)
  } catch (err) {
    console.log('Malformed query')
    return
  }

  // Connect to the database
  require('../controllers/database.js')

  // Find an array of courses and populate the courses with the course evaluation information from the Registrar. Save the data to the database
  courseModel.find(query, {semester: 1, courseID: 1}, function (error, courses) {
    if (error) {
      console.log(error)
    }

    // Check that the user is aware of the number of requests they are about to send
    console.log('You are about to request the course evaluation data for %d courses.', courses.length)
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

          console.log('Processing course %d in semester %d. (Course %d of %d).', thisCourse.courseID, thisCourse.semester._id, courseIndex, courses.length)

          // Fetch the evaluation data
          getCourseEvaluationData(thisCourse.semester._id, thisCourse.courseID, function (scores, comments) {
            let promises = []

            // Iterate over the comments
            for (var commentIndex in comments) {
              // Save the comments to the database
              promises.push(evaluationModel.findOneAndUpdate({
                comment: comments[commentIndex],
                course: thisCourse._id
              }, {
                comment: comments[commentIndex],
                course: thisCourse._id
              }, {
                new: true,
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true
              }).exec())
            }

            // Update the course with the newly-fetched evaluation data
            if (scores !== {}) {
              promises.push(courseModel.update({
                _id: thisCourse._id
              }, {
                $set: {
                  scores: scores
                }
              }))
            }

            // Wait for all database operations to complete
            Promise.all(promises).then(function () {
              if (--coursesPendingProcessing === 0) {
                console.log('Fetched and saved all the requested course evaluations.')
                process.exit(0)
              }
            }).catch(function (reason) {
              console.log(reason)
            })
          })
        }, 100)
      } else {
        process.exit(0)
      }
    })
  })
})
