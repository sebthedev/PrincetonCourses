// Handle requests to the /course API endpoint

// Load Express
let express = require('express')
let router = express.Router()

// Load internal modules
let courseModel = require.main.require('./models/course.js')
let userModel = require.main.require('./models/user.js')

// Allow requesting only the classes information
// (This is used to allow the rest of the class page to be cached by the client, and only request this information on pageload)
router.use('/:id/classes', function (req, res) {
  // Validate that the request is correct
  if ((typeof (req.params.id) === 'undefined') || isNaN(req.params.id)) {
    res.sendStatus(400)
    return
  }

  courseModel.findOne({_id: req.params.id}, {'classes': true}).then(function (course) {
    res.send(course.classes)
  }).catch(function (err) {
    console.log(err)
    res.sendStatus(500)
  })
})

// Return all the information about a specific semester of a course
router.use('/:id', function (req, res) {
    // Validate that the request is correct
  if ((typeof (req.params.id) === 'undefined') || isNaN(req.params.id)) {
    res.sendStatus(400)
    return
  }

    // Query the database for the information about the specified semester of the requested course
  var queryCoursePromise = courseModel.findOne({_id: req.params.id}).populate({
    path: 'comments',
    options: {
      sort: {
        votes: -1
      }
    }
  }).exec()

    // Find the evaluation details for the most recent semester of this course for which evaluations exist
  var mostRecentEvaluationsPromise = courseModel.find({
    courseID: req.params.id.substring(4),
    $and: [
      {
        scores: {
          $exists: true
        }
      },
      {
        scores: {
          $not: {
            $eq: {}
          }
        }
      }, {
        scoresFromPreviousSemester: {
          $not: {
            $eq: true
          }
        }
      }
    ]
  }, {
    scores: 1,
    semester: 1
  }).sort({'semester': -1}).populate({
    path: 'comments',
    options: {
      sort: {
        votes: -1
      }
    }
  }).exec()

    // Query the database for the basic details of all the semesters of the requested course
  var semestersPromise = courseModel.find({
    courseID: req.params.id.substring(4)
  }, {
    'scores.Quality of Course': 1,
    scoresFromPreviousSemester: 1,
    semester: 1,
    instructors: 1,
    _id: 1
  }).sort({semester: -1}).exec()

    // Query the database for the number of users who have marked this course as a favorite
  var favoriteCountPromise = userModel.count({
    favoriteCourses: req.params.id
  }).exec()

    // Resolve the promises
  Promise.all([queryCoursePromise, mostRecentEvaluationsPromise, semestersPromise, favoriteCountPromise]).then(function (results) {
    var queryCourse = results[0]
    var mostRecentEvaluations = results[1]
    var semesters = results[2]
    var favoritesCount = results[3]

      // Check that a course exists for the requested id
    if (queryCourse === null) {
      res.sendStatus(404)
      return
    }

      // Convert the Mongoose object into a regular object
    queryCourse = queryCourse.toObject()

      // Delete certain properties from each course in semesters
    for (var semestersIndex in semesters) {
        // Convert the Mongoose object into a regular object
      let thisOtherSemester = semesters[semestersIndex].toObject()

        // Delete the unneeded (and unpopulated) virtuals
      delete thisOtherSemester.comments
      delete thisOtherSemester.commonName

        // Delete scores and scoresFromPreviousSemester if the scores were inserted into this course from a previous semester
      if (typeof (thisOtherSemester.scoresFromPreviousSemester) === 'boolean' && thisOtherSemester.scoresFromPreviousSemester) {
        delete thisOtherSemester.scores
        delete thisOtherSemester.scoresFromPreviousSemester
      }

        // Re-write the modified semester into its original array
      semesters[semestersIndex] = thisOtherSemester
    }
    queryCourse.semesters = semesters

      // Determine whether we should insert into this course the evaluations from the most recent semester for which evaluations exist
    let useOldEvaluations = queryCourse.scoresFromPreviousSemester || !queryCourse.hasOwnProperty('scores') || queryCourse.hasOwnProperty('scores') && queryCourse.scores === {}

      // Insert into the queryCourse the evaluation data for the most recent semester for which evaluations exist
    if (useOldEvaluations && mostRecentEvaluations.length > 0) {
      queryCourse.evaluations = mostRecentEvaluations[0].toObject()

        // If there exist evaluations for a semester of this course taught by this instructor, use those evaluations instead
      if (typeof (queryCourse.scoresFromPreviousSemesterSemester) === 'number') {
        mostRecentEvaluations.find(function (thisPastSemesterCourse) {
          if (thisPastSemesterCourse.semester._id === queryCourse.scoresFromPreviousSemesterSemester) {
            queryCourse.evaluations = thisPastSemesterCourse.toObject()
            return true
          } else {
            return false
          }
        })
      }

        // Note if the user has previously up-voted this comment
      for (var commentIndex in queryCourse.evaluations.comments) {
        queryCourse.evaluations.comments[commentIndex].voted = queryCourse.evaluations.comments[commentIndex].voters.indexOf(res.locals.user._id) > -1
        delete queryCourse.evaluations.comments[commentIndex].voters
      }
      delete queryCourse.evaluations.commonName
    } else {
      queryCourse.evaluations = {}
      if (queryCourse.hasOwnProperty('scores')) {
        queryCourse.evaluations.scores = queryCourse.scores
        delete queryCourse.scores
      }
      if (queryCourse.hasOwnProperty('comments')) {
        queryCourse.evaluations.comments = queryCourse.comments
        delete queryCourse.comments
      }
    }

      // Delete the raw comments array from the returned course object.
    delete queryCourse.comments

      // Insert the number of users who have favorited this course into the returned course object
    queryCourse.favoritesCount = favoritesCount

    res.set('Cache-Control', 'public, max-age=14400').json(queryCourse)
  }).catch(function (err) {
    console.log(err)
    res.sendStatus(500)
  })
})

module.exports = router
