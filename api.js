var express = require('express')
var router = express.Router()

// Load internal modules
var auth = require('./authentication.js')
var courseModel = require('./course.js')
var semesterModel = require('./semester.js')

// Check that the user is authenticated
router.all('*', function (req, res, next) {
  if (!auth.userIsAuthenticated(req)) {
    res.sendStatus(403)
  } else {
    next()
  }
})

// Route a req for the homepage
router.get('/whoami', function (req, res) {
  res.json({ netid: req.app.get('user').netid })
})

// Respond to requests for course listings
router.post('/courses', function (req, res) {
  console.log('Request for "%s" in %s', req.body.query, req.body.semester)

  // Check the request contains a query
  if (typeof (req.body.query) === 'undefined') {
    res.sendStatus(400)
  }

  // Extract the query and sort parameters from the request
  var query = JSON.parse(req.body.query)
  var sort
  if (typeof (req.body.sort) === 'undefined') {
    sort = JSON.parse(req.body.sory)
  }

  // Send the request to the database
  courseModel.find(query, sort, function (err, courses) {
    if (err) {
      console.log(err)
      res.sendStatus(500)
    } else {
      res.json(courses)
    }
  })
  // courseModel.findCoursesFuzzy(req.body.query, req.body.semester, function (results) {
  //   res.json(results)
  // })
})

// Respond to requests for semester listings
router.get('/semesters', function (req, res) {
  semesterModel.getAllSemesters(function (semesters) {
    res.json(semesters)
  })
})

// Export the routes on this router (/login, /verify, and /logout)
module.exports.router = router
