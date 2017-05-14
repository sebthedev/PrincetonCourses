// Handle requests to the /clashDetectionCourses API endpoint

// Load Express
let express = require('express')
let router = express.Router()

// Load internal modules
let userModel = require.main.require('./models/user.js')
let courseModel = require.main.require('./models/course.js')

const abbreviatedCourseProjection = {
  assignments: 0,
  grading: 0,
  classes: 0,
  description: 0,
  otherinformation: 0,
  otherrequirements: 0,
  prerequisites: 0,
  semesters: 0,
  instructors: 0
}

// Respond to requests to PUT and DELETE courses into/from the user's course clash detection list
router.route('/:id').all(function (req, res, next) {
  if (typeof (req.params.id) === 'undefined' || isNaN(req.params.id)) {
    res.sendStatus(400)
    return
  }
  next()
}).put(function (req, res) {
  let user = res.locals.user
  let courseID = parseInt(req.params.id)

  // Check that this course is in the favoriteCourses list
  if (!(typeof (user.favoriteCourses) !== 'undefined' && user.favoriteCourses.includes(courseID))) {
    res.sendStatus(400)
    return
  }

  // Update the user's list of favorite courses
  var updateUserPromise = userModel.update({
    _id: user._id
  }, {
    $addToSet: {
      clashDetectionCourses: parseInt(req.params.id)
    }
  }).exec()

  // Fetch the data about this course
  var fetchCoursePromise = courseModel.findById(req.params.id, abbreviatedCourseProjection).exec()

  // Once both requests complete, return the course data to the client
  Promise.all([updateUserPromise, fetchCoursePromise]).then(function (results) {
    if (results[1]) {
      res.json(results[1])
    } else {
      res.sendStatus(404)
    }
  }).catch(function (error) {
    console.log(error)
    res.sendStatus(500)
  })
}).delete(function (req, res) {
  var user = res.locals.user

  userModel.update({
    _id: user._id
  }, {
    $pull: {
      clashDetectionCourses: parseInt(req.params.id)
    }
  }, function (err) {
    if (err) {
      res.sendStatus(500)
      return
    }
    res.sendStatus(200).json
  })
})

module.exports = router
