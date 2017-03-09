// This script is the main app script that powers Princeton Courses. It runs immediately when the app launches

// Greet the world!
console.log('Launching Princeton Courses.')

// Load Node.js components
const path = require('path')

// Load external dependencies
require('mongoose')
var express = require('express')
var session = require('cookie-session')
var app = express()

var bodyParser = require('body-parser')

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// Load internal modules
var config = require('./config')
require('./user.js')
var courseModel = require('./course.js')
var semesterModel = require('./semester.js')
var auth = require('./authentication.js')

// Connect to the database
require('./database.js')

// Configure the app to save a cookie with two attributes (for netid and status)
app.use(session({ keys: ['key1', 'key2'] }))

// Attempt to load into the app the currently logged-in user
app.use('*', auth.loadUser)

// Attach routers (these are modules that contain a distinct set of routes)
app.use('/auth', auth.router)

// Route a request for the homepage
app.get('/', function (req, res) {
  // Check whether the user sending this request is authenticated
  if (!auth.userIsAuthenticated(req)) {
        // The user in unauthenticated. Display a splash page.
    res.render('pages/splash')
  } else {
    // The user has authenticated. Display the app
    res.render('pages/app', {
      netid: app.get('user').netid
    })
  }
})

// Route a request for the alternative homepage
app.get('/appalt', function (req, res) {
  // Check whether the user sending this request is authenticated
  if (!auth.userIsAuthenticated(req)) {
        // The user in unauthenticated. Display a splash page.
    res.render('pages/splash')
  } else {
    // The user has authenticated. Display the app
    res.render('pages/appalt', {
      netid: app.get('user').netid
    })
  }
})

// Route a req for the homepage
app.get('/api/whoami', function (req, res) {
  // Check whether the user sending this request is authenticated
  if (!auth.userIsAuthenticated(req)) {
    res.json({ netid: 'You are not logged in' })
  } else {
    res.json({ netid: app.get('user').netid })
  }
})

// Route API requests for course given course id
app.post('/api/course_by_id', function (req, res) {
  console.log('Request for course with id %s', req.body.course_id)
  courseModel.findCoursesById(req.body.course_id, function (results) {
    res.json(results)
  })
})

// Route API requests for course details
app.post('/api/courses', function (req, res) {
  console.log('Request for "%s" in %s', req.body.query, req.body.semester)
  courseModel.findCoursesFuzzy(req.body.query, req.body.semester, function (results) {
    res.json(results)
  })
})

app.get('/api/semesters', function (req, res) {
  semesterModel.getAllSemesters(function (semesters) {
    res.json(semesters)
  })
})

// Map any files in the /public folder to the root of our domain
// For example, if there is a file at /public/cat.jpg of this app,
// it can be accessed on the web at [APP DOMAIN NAME]/cat.jpg
app.use(express.static(path.join(__dirname, '/public')))

// Configure the EJS templating system (http://www.embeddedjs.com)
app.set('view engine', 'ejs')

// Start listening for requests
app.listen(config.port, function () {
  console.log('Listening for reqs on port %d.', config.port)
})
