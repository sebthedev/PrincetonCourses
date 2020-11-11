// A script that uses Cheerio to scrape course evaluation information from the Registrar
// At the moment this script does not save the data anywhere

// Load external dependencies
const cheerio = require('cheerio')
const request = require('request')
const promptly = require('promptly')
require('colors')

// Load config variables from the .env file
require('dotenv').config()

// Load internal modules
const courseModel = require('../models/course.js')
require('../models/semester.js')
const evaluationModel = require('../models/evaluation.js')

let sessionCookie
let courses

// Load a request from the server and call the function externalCallback
const loadPage = function (term, courseID, callback) {
  // Define the HTTP request options
  const options = {
    url: 'https://reg-captiva.princeton.edu/chart/index.php?terminfo=' + term + '&courseinfo=' + courseID,
    headers: {
      'Cookie': `PHPSESSID=${sessionCookie};`,
      'User-Agent': 'Princeton Courses (https://www.princetoncourses.com)'
    }
  }

  request(options, (err, response, body) => {
    if (err) {
      return console.error(err)
    }
    callback(body)
  })
}

// Return the course evaluation data for the given semester/courseID to the function callback
const getCourseEvaluationData = function (semester, courseID, externalCallback) {
  loadPage(semester, courseID, function (data) {
    const $ = cheerio.load(data)
    if ($('title').text() !== 'Course Evaluation Results') {
      console.error('Scraping the evaluations failed. Your session cookie was probably bad. You must provide a valid session cookie.')
      console.log('Goodbye.')
      process.exit(1)
    }

    console.log('\tRecieved data for course %s in semester %s.', courseID, semester)

    // If this course is in the current semester, then the Registrar's page defaults back to the most recent semester for which course evaluations exist. This checks that we have indeed scraped the evaluations for the correct semester.
    if ($("td[bgcolor=Gainsboro] a[href*='terminfo=" + semester + "']").length !== 1) {
      externalCallback({}, [])
      return
    }

    // Get Chart Data
    const b64EncodedChartData = $('#chart_settings').attr('value')
    const scores = {}
    if (b64EncodedChartData) {
      const chartData = Buffer.from(b64EncodedChartData, 'base64').toString('ascii')
      const chart = JSON.parse(chartData)

      // Extract Numerical Evaluation Data from Chart
      const xItems = chart.PlotArea.XAxis.Items
      const yItems = chart.PlotArea.ListOfSeries[0].Items
      for (const itemIndex in chart.PlotArea.XAxis.Items) {
        scores[xItems[itemIndex].Text] = parseFloat(yItems[itemIndex].YValue)
      }
    }

    // Extract student comments
    const comments = []
    $('table:last-child tr:not(:first-child) td').each(function (index, element) {
      comments.push($(element).text().replace('\n', ' ').replace('\r', ' ').trim())
    })

    externalCallback(scores, comments)
  })
}

const instructions = [
  '\t1. Copy this JavaScript command: ' + 'document.cookie.match(/PHPSESSID=([^;]+)/)[1]'.yellow,
  '\t2. Visit this address in your web browser and run the copied JavaScript command in the developer console: https://reg-captiva.princeton.edu/chart/index.php\n'
]

console.log('Welcome to the script for scraping course evaluations from the Princeton University registrar\'s website.\n')
console.log('Course evaluations are protected behind Princeton\'s Central Authentication System. To scrape the course evaluations, follow these instructions:')
console.log(instructions.join('\n'))

promptly.prompt('Paste the session cookie output from the developer console and hit enter:').then(cookie => {
  sessionCookie = cookie
  return promptly.prompt('Enter the MongoDB-style query for the courses for which you want to import the evaluations:', {
    default: '{}'
  })
}).then(query => {
  // Connect to the database
  require('../controllers/database.js')
  regex_input = "/^(" + query + ")/";
  // Find an array of courses and populate the courses with the course evaluation information from the Registrar. Save the data to the database
  return courseModel.find({ department: { $regex: regex_input } });
}).then(returnedCourses => {
  courses = returnedCourses;
  return promptly.confirm(`You are about to request the course evaluation data for ${courses.length} courses. Are you sure you want to do this? (y/n):`)
}).then(confirmation => {
  if (!confirmation) {
    console.log('Goodbye')
    return process.exit(0)
  }

  let coursesPendingProcessing = courses.length
  let courseIndex = 0

  const interval = setInterval(function () {
    const thisCourse = courses[courseIndex++]

    // If there are no more courses, cease sending requests
    if (typeof (thisCourse) === 'undefined') {
      clearInterval(interval)
      return
    }

    console.log(`Processing course ${thisCourse.courseID} in semester ${thisCourse.semester._id}. (Course ${courseIndex} of ${courses.length}).`)

    // Fetch the evaluation data
    getCourseEvaluationData(thisCourse.semester._id, thisCourse.courseID, function (scores, comments) {
      let promises = []

      // Iterate over the comments
      for (const comment of comments) {
        // Save the comments to the database
        promises.push(evaluationModel.findOneAndUpdate({
          comment: comment,
          course: thisCourse._id
        }, {
          comment: comment,
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
          },
          $unset: {
            scoresFromPreviousSemester: '',
            scoresFromPreviousSemesterSemester: ''
          }
        }))
      }

      // Wait for all database operations to complete
      Promise.all(promises).then(function () {
        if (coursesPendingProcessing % 10 === 0) {
          console.log(`${coursesPendingProcessing} courses still processing…`)
        }
        if (--coursesPendingProcessing === 0) {
          console.log('Fetched and saved all the requested course evaluations.')
          process.exit(0)
        }
      }).catch(function (reason) {
        console.log(reason)
      })
    })
  }, 500)
}).catch(err => {
  console.error(err)
  process.exit(1)
})
