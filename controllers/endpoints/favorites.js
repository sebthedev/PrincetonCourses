// Handle requests to the /favorites API endpoint

// Load Express
let express = require('express')
let router = express.Router()

// Load internal modules
let userModel = require.main.require('./models/user.js')
let evaluationModel = require.main.require('./models/evaluation.js')
let courseModel = require.main.require('./models/course.js')
let courseClashDetector = require.main.require('./controllers/courseClashDetector.js')
let semesterModel = require.main.require('./models/semester.js')

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

// Load the departments once from the database
let semesters = []
semesterModel.getAll(function (fetchedSemesters) {
  semesters = fetchedSemesters
})

// Respond to requests to PUT and DELETE courses into/from the user's favorite courses list
router.route('/:id').all(function (req, res, next) {
  if (typeof (req.params.id) === 'undefined' || isNaN(req.params.id)) {
    res.sendStatus(400)
    return
  }
  next()
}).put(function (req, res) {
  var user = res.locals.user

  let userPopulatePromise = res.locals.user.populate('clashDetectionCourses').execPopulate()

  // Update the user's list of favorite courses
  var updateUserPromise = userModel.update({
    _id: user._id
  }, {
    $addToSet: {
      favoriteCourses: parseInt(req.params.id)
    }
  }).exec()

  // Fetch the data about this course
  let projection = {}
  Object.assign(projection, abbreviatedCourseProjection)
  delete projection.classes
  var fetchCoursePromise = courseModel.findById(req.params.id, projection).exec()

  // Once both requests complete, return the course data to the client
  Promise.all([updateUserPromise, fetchCoursePromise, userPopulatePromise]).then(function (results) {
    let newlyFavoritedCourse = results[1]
    let user = results[2]

    if (newlyFavoritedCourse) {
      // Determine whether this newly favorited course clashes with the existing pinned courses
      if (typeof (user.clashDetectionCourses) !== 'undefined' && user.clashDetectionCourses.length > 0) {
        // Convert the Mongoose objects to regular JavaScript objects
        let clashDetectionCourses = user.clashDetectionCourses.map(function (course) {
          return course.toObject()
        })
        newlyFavoritedCourse = newlyFavoritedCourse.toObject()

        // Determine whether this newly favorited course clashes with the existing pinned courses
        let detectClashesResult = courseClashDetector.detectCourseClash(clashDetectionCourses, [newlyFavoritedCourse], semesters[0]._id)
        if (detectClashesResult.status === 'success') {
          newlyFavoritedCourse = detectClashesResult.courses[0]
        }
      }

      // Return the newly favorited course
      res.json(newlyFavoritedCourse)
    } else {
      res.sendStatus(404)
    }
  }).catch(function (error) {
    console.log(error)
    res.sendStatus(500)
  })
}).delete(function (req, res) {
  var user = res.locals.user
  let courseID = parseInt(req.params.id)

  userModel.update({
    _id: user._id
  }, {
    $pull: {
      favoriteCourses: courseID,
      clashDetectionCourses: courseID
    }
  }, function (err) {
    if (err) {
      res.sendStatus(500)
      return
    }
    res.sendStatus(200).json
  })
})

// Respond to a request for a list of this user's favorite courses
router.get('/', function (req, res) {
  res.locals.user.populate('favoriteCourses', function (err, user) {
    if (err) {
      console.log(err)
      res.sendStatus(500)
    } else {
      res.set('Cache-Control', 'no-cache')
      if (typeof (user.favoriteCourses) !== 'undefined') {
        let favoriteCourses = user.favoriteCourses

        // Insert into favoriteCourses each course's clashDetectionPin status
        if (typeof (user.clashDetectionCourses) !== 'undefined') {
          // Transform the courses into regular JavaScript objects
          favoriteCourses = user.favoriteCourses.map(function (course) {
            return course.toObject()
          })

          // Extract from favoriteCourses the hydrated favoriteCourses that are on the user's clashDetectionCourses list
          let clashDetectionCoursesPopulated = favoriteCourses.filter(function (course) {
            return user.clashDetectionCourses.includes(course._id)
          })

          // Determine which (if any) of the favoriteCourses that are not on the clashDetectionCourses list clash with the courses on the clashDetectionCourses list
          let detectClashesResult = courseClashDetector.detectCourseClash(clashDetectionCoursesPopulated, favoriteCourses, semesters[0]._id)
          if (detectClashesResult.hasOwnProperty('status') && detectClashesResult.status === 'success') {
            favoriteCourses = detectClashesResult.courses
          }

          // Insert into each clashDetectionCourses course clashDetectionStatus = true
          favoriteCourses = favoriteCourses.map(function (course) {
            course.clashDetectionStatus = user.clashDetectionCourses.includes(course._id)
            return course
          })
        }
        res.status(200).json(favoriteCourses)
      } else {
        res.status(200).json([])
      }
    }
  })
})

// Handle requests to vote on an evaluation
router.route('/:id/vote').all(function (req, res, next) {
  if (typeof (req.params.id) === 'undefined') {
    res.sendStatus(400)
    return
  }

  console.log('Received request to /evaluations/:id/vote')

  evaluationModel.findById(req.params.id).exec(function (err, evaluation) {
    if (err) {
      console.log(err)
      res.sendStatus(500)
      return
    }
    if (evaluation === null) {
      res.sendStatus(404)
      return
    }
    next()
  })
}).put(function (req, res) {
  let user = res.locals.user

  evaluationModel.findById(req.params.id).exec(function (err, evaluation) {
    if (err) {
      console.log(err)
      res.sendStatus(500)
      return
    }

    // Ensure the user has not already voted on this comment
    if (typeof (evaluation.voters) !== 'undefined' && evaluation.voters.indexOf(user._id) > -1) {
      res.sendStatus(403)
      return
    }

    // Update the evaluation (increment the number of votes and add the user's netID to the list of voters)
    evaluationModel.findByIdAndUpdate(req.params.id, {
      $inc: {
        votes: 1
      },
      $addToSet: {
        voters: user._id
      }
    }, function (err) {
      if (err) {
        console.log(err)
        res.sendStatus(500)
        return
      }

      // Return success to the client
      res.sendStatus(200)
    })
  })
}).delete(function (req, res) {
  let user = res.locals.user

  evaluationModel.findById(req.params.id).exec(function (err, evaluation) {
    if (err || typeof (evaluation.voters) === 'undefined') {
      console.log(err)
      res.sendStatus(500)
      return
    }

    // Ensure the user has already voted on this comment
    if (typeof (evaluation.voters) !== 'object' && evaluation.voters.indexOf(user._id) === -1) {
      res.sendStatus(403)
      return
    }

    // Update the evaluation (increment the number of votes and add the user's netID to the list of voters)
    evaluationModel.findByIdAndUpdate(req.params.id, {
      $inc: {
        votes: -1
      },
      $pull: {
        voters: user._id
      }
    }, function (err) {
      if (err) {
        console.log(err)
        res.sendStatus(500)
        return
      }

      // Return success to the client
      res.sendStatus(200)
    })
  })
})

module.exports = router
