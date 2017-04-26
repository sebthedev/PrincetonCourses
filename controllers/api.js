let express = require('express')
let router = express.Router()

// Load internal modules
let auth = require('./authentication.js')

// Check that the user is authenticated
router.all('*', function (req, res, next) {
  if (!auth.userIsAuthenticated(req)) {
    res.sendStatus(401)
  } else {
    next()
  }
})

// Prevent caching of PUT requests
router.put('*', function (req, res, next) {
  res.set('Cache-Control', 'no-cache')
  next()
})

// Prevent caching of DELETE requests
router.delete('*', function (req, res, next) {
  res.set('Cache-Control', 'no-cache')
  next()
})

// Handle requests to all the API endpoints
router.use('/search', require('./endpoints/search.js'))
router.use('/course', require('./endpoints/course.js'))
router.use('/instructor', require('./endpoints/instructor.js'))
router.use('/user/favorites', require('./endpoints/favorites.js'))
router.use('/user/clashDetectionCourses', require('./endpoints/clashDetectionCourses.js'))
router.use('/evaluations', require('./endpoints/evaluations.js'))
router.use('/departments', require('./endpoints/departments.js'))
router.use('/semesters', require('./endpoints/semesters.js'))

// Export the routes on this router
module.exports.router = router
