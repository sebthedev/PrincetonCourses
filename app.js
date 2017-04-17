// This script is the main app script that powers Princeton Courses. It runs immediately when the app launches

// Greet the world!
console.log('Launching Princeton Courses.')

// Load Node.js components
const path = require('path')

// Load external dependencies
require('mongoose')
var express = require('express')
var session = require('cookie-session')
var bodyParser = require('body-parser')

// Initialise Express, which makes the server work
var app = express()

// Initialise bodyParser, which parses the data out of web requests
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// Load internal modules
var config = require('./controllers/config')
var auth = require('./controllers/authentication.js')
var api = require('./controllers/api.js')

// Connect to the database
require('./controllers/database.js')

// Configure the app to save a cookie with two attributes (for netid and status)
app.use(session({ keys: ['key1', 'key2'] }))

// Attempt to load into the app the currently logged-in user
app.use('*', auth.loadUser)

// Attach routers (these are modules that contain a distinct set of routes)
app.use('/auth', auth.router)
app.use('/api', api.router)

// Route a request for the homepage
app.get('/', function (req, res) {
  // Check whether the user sending this request is authenticated
  if (!auth.userIsAuthenticated(req)) {
    // The user in unauthenticated. Display a splash page.
    res.render('pages/splash', {
      environment: process.env.NODE_ENV
    })
  } else {
    // The user has authenticated. Display the app
    res.render('pages/app', {
      netid: app.get('user')._id,
      environment: process.env.NODE_ENV
    })
  }
})

// Route a request for a page inside the app
app.get('/course/:id', function (req, res) {
  // Check whether the user sending this request is authenticated
  if (!auth.userIsAuthenticated(req)) {
    res.redirect('/auth/login?redirect=' + req.originalUrl)
  } else {
    // The user has authenticated. Display the app
    res.render('pages/app', {
      netid: app.get('user')._id,
      production: process.env.NODE_ENV
    })
  }
})

// Route a request for the about page
app.get('/about', function (req, res) {
  res.render('pages/about', {
    // netid: app.get('user')._id,
    environment: process.env.NODE_ENV
  })
})

// Route a request for the main app page
app.get('/app', function (req, res) {
  res.render('pages/app', {
    netid: app.get('user')._id,
    environment: process.env.NODE_ENV
  })
})

// Map any files in the /public folder to the root of our domain
// For example, if there is a file at /public/cat.jpg of this app,
// it can be accessed on the web at [APP DOMAIN NAME]/cat.jpg
app.use(express.static(path.join(__dirname, '/public')))

app.get('*', function (req, res) {
  res.sendStatus(404)
})

// Configure the EJS templating system (http://www.embeddedjs.com)
app.set('view engine', 'ejs')

// Start listening for requests
app.listen(config.port, function () {
  console.log('Listening for reqs on port %d.', config.port)
})
