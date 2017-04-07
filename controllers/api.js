var express = require('express')
var router = express.Router()

// Load internal modules
var auth = require('./authentication.js')
var courseModel = require.main.require('./models/course.js')
var semesterModel = require.main.require('./models/semester.js')
var instructorModel = require.main.require('./models/instructor.js')
var userModel = require.main.require('./models/user.js')
var evaluationModel = require.main.require('./models/evaluation.js')

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

// Intelligent searching for both courses and instructors
router.get('/search/:query', function (req, res) {
    // Validate that the request is correct
  if (typeof (req.params.query) === 'undefined') {
    res.sendStatus(400)
    return
  }

  // Initialise the queries and projections for the courses and instructors searches
  var courseQuery = {}
  var courseProjection = {}
  var instructorQuery = {}
  var instructorProjection = {}

  // Permit explicit filtering based on keywords
  var queryWords = req.params.query.split(' ')
  const distributionAreas = ['EC', 'EM', 'HA', 'LA', 'SA', 'QR', 'STL', 'STN']
  var newQueryWords = []
  const courseDeptNumberRegexp = /([A-Z]{3})(\d{1,3})/
  for (var queryWordsIndex in queryWords) {
    var thisQueryWord = queryWords[queryWordsIndex].toUpperCase()
    let matches

    // Check for distribution areas, pdf status, and wildcards
    if (distributionAreas.indexOf(thisQueryWord) > -1) {
      courseQuery.distribution = thisQueryWord
    } else if (thisQueryWord === 'PDF') {
      courseQuery['pdf.permitted'] = true
    } else if ((matches = courseDeptNumberRegexp.exec(thisQueryWord)) !== null) {
      // Expand "COS333" to "COS 333"
      newQueryWords.push(matches[1], matches[2])
    } else if (thisQueryWord !== '*') {
      newQueryWords.push(thisQueryWord)
    }
  }

  // Build the database queries and projections
  if (newQueryWords.length > 0) {
    var searchQuery = newQueryWords.join(' ')

    // Basic query that performs a full-text-search with the search string
    const initialQuery = {
      $text: {
        $search: searchQuery
      }
    }

    // The basic projection that inserts the document's relevance into each returned document
    const initialProjection = {
      relevance: {
        $meta: 'textScore'
      }
    }

    Object.assign(instructorQuery, initialQuery)
    Object.assign(courseQuery, initialQuery)
    Object.assign(instructorProjection, initialProjection)
    Object.assign(courseProjection, initialProjection)
  }

  // Filter courses by semester
  if (typeof (req.query.semester) !== 'undefined' && !isNaN(req.query.semester)) {
    courseQuery.semester = req.query.semester
  }

  // Remove in-depth course information if the client requests "brief" results
  if (typeof (req.query.detailed) !== 'string' || (typeof (req.query.detailed) === 'string' && JSON.parse(req.query.detailed) !== false)) {
    // Merge the existing projection parameters with the parameters filtering-out all of these attributes
    Object.assign(courseProjection, {
      'evaluations.studentComments': 0,
      assignments: 0,
      grading: 0,
      classes: 0,
      description: 0,
      otherinformation: 0,
      otherrequirements: 0,
      prerequisites: 0,
      semesters: 0,
      instructors: 0,
      comments: 0,
      website: 0
    })
  }

  // Construct the courseModel database query as a promise
  var coursePromise = courseModel.find(courseQuery, courseProjection).exec()

  // Construct the courseModel database query as a promise
  var instructorPromise = instructorModel.find(instructorQuery, instructorProjection).exec()

  // Trigger both promises and wait for them to both return
  Promise.all([coursePromise, instructorPromise]).then(values => {
    var courses = values[0]
    var instructors = values[1]

    // Perform and-based filtering on the courses returned from the database
    var filteredCourses = []
    // Define the properties in which all of the query terms must occur
    const filteringProperties = ['title', 'department', 'catalogNumber']
    for (let courseIndex in courses) {
      let thisCourse = courses[courseIndex].toObject()

      // Concatenate the course's relevant filtering properties into a single string
      let courseDetailsConcatenation = []
      for (let filteringPropertyIndex in filteringProperties) {
        if (thisCourse.hasOwnProperty(filteringProperties[filteringPropertyIndex])) {
          courseDetailsConcatenation.push(thisCourse[filteringProperties[filteringPropertyIndex]])
        }
      }
      if (thisCourse.hasOwnProperty('crosslistings')) {
        for (let crosslistingIndex in thisCourse.crosslistings) {
          courseDetailsConcatenation.push(thisCourse.crosslistings[crosslistingIndex].department)
          courseDetailsConcatenation.push(thisCourse.crosslistings[crosslistingIndex].catalogNumber)
        }
      }
      courseDetailsConcatenation = courseDetailsConcatenation.join(' ').toUpperCase()

      // Check whether all of the query words are in the courseDetailsConcatenation
      let passingWords = 0
      for (let thisQueryWordIndex in newQueryWords) {
        if (courseDetailsConcatenation.indexOf(newQueryWords[thisQueryWordIndex]) > -1) {
          passingWords++
        }
      }
      if (passingWords === newQueryWords.length) {
        filteredCourses.push(thisCourse)
      }
    }
    courses = filteredCourses

    // Insert into the course or instructor object its type
    for (var i in courses) {
      courses[i].type = 'course'
    }
    for (var j in instructors) {
      instructors[j] = instructors[j].toObject()
      instructors[j].type = 'instructor'
    }

    // Merge the results from the courses and instructors collections
    var combinedResult = courses.concat(instructors)

    // Determine sort parameter
    var sortKey = 'relevance'
    if (typeof (req.query.sort) !== 'undefined') {
      sortKey = req.query.sort
    }

    // Invert the sort order if the sort key is relevance (for which we want the most relevant result first)
    var invertSortOrder = Math.pow(-1, sortKey === 'relevance')

    // Sort the results
    combinedResult.sort(function (a, b) {
      // First sort by the specified sort key
      if (sortKey !== 'rating') {
        if (a[sortKey] > b[sortKey]) {
          return 1 * invertSortOrder
        } else if (a[sortKey] < b[sortKey]) {
          return -1 * invertSortOrder
        }
      }

      // Then sort by course rating

      // If the course lacks a score it is lower than a course that has a score
      if (!a.hasOwnProperty('scores') || !a.scores.hasOwnProperty('Overall Quality of the Course')) {
        return 1
      }
      if (!b.hasOwnProperty('scores') || !b.scores.hasOwnProperty('Overall Quality of the Course')) {
        return -1
      }

      // Return the difference between the scores
      return b.scores['Overall Quality of the Course'] - a.scores['Overall Quality of the Course']
    })

    // Send the result to the client
    res.set('Cache-Control', 'public, max-age=28800').json(combinedResult)
  }).catch(reason => {
    console.log(reason)
    res.sendStatus(500)
  })
})

// Return all the information about a specific semester of a course
router.get('/course/:id', function (req, res) {
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
  }).sort({'semester': -1}).limit(1).populate({
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
    'scores.Overall Quality of the Course': 1,
    scoresFromPreviousSemester: 1,
    semester: 1,
    instructors: 1,
    _id: 1
  }).sort({semester: -1}).exec()

  // Resolve the promises
  Promise.all([queryCoursePromise, mostRecentEvaluationsPromise, semestersPromise]).then(function (results) {
    var queryCourse = results[0]
    var mostRecentEvaluations = results[1]
    var semesters = results[2]

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

    let useOldEvaluations = queryCourse.scoresFromPreviousSemester || !queryCourse.hasOwnProperty('scores') || queryCourse.hasOwnProperty('scores') && queryCourse.scores === {}

    // Insert into the queryCourse the evaluation data for the most recent semester for which evaluations exist
    if (useOldEvaluations && mostRecentEvaluations.length === 1) {
      queryCourse.evaluations = mostRecentEvaluations[0].toObject()

      // Note if the user has previously up-voted this comment
      for (var commentIndex in queryCourse.evaluations.comments) {
        queryCourse.evaluations.comments[commentIndex].voted = queryCourse.evaluations.comments[commentIndex].voters.indexOf(req.app.get('user')._id) > -1
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

    delete queryCourse.comments
    res.set('Cache-Control', 'public, max-age=14400').json(queryCourse)
  }).catch(function (err) {
    console.log(err)
    res.sendStatus(500)
  })
})

// Respond to requests for an instructor
router.get('/instructor/:id', function (req, res) {
  // Validate that the request is correct
  if ((typeof (req.params.id) === 'undefined') || isNaN(req.params.id)) {
    res.sendStatus(400)
    return
  }

  // Search for the instructor in the database
  instructorModel.findOne({_id: req.params.id}).populate('courses').exec(function (err, instructor) {
    if (err) {
      console.log(err)
      res.send(500)
    } else {
      if (instructor === null) {
        res.sendStatus(404)
      } else {
        res.set('Cache-Control', 'public, max-age=86400').json(instructor)
      }
    }
  })
})

// Respond to requests to PUT and DELETE courses into/from the user's favorite courses list
router.route('/user/favorites/:id').all(function (req, res, next) {
  if (typeof (req.params.id) === 'undefined' || isNaN(req.params.id)) {
    res.sendStatus(400)
    return
  }
  next()
}).put(function (req, res) {
  var user = req.app.get('user')

  // Update the user's list of favorite courses
  var updateUserPromise = userModel.update({
    _id: user._id
  }, {
    $addToSet: {
      favoriteCourses: parseInt(req.params.id)
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
  var user = req.app.get('user')

  userModel.update({
    _id: user._id
  }, {
    $pull: {
      favoriteCourses: parseInt(req.params.id)
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
router.get('/user/favorites', function (req, res) {
  req.app.get('user').populate('favoriteCourses', function (err, user) {
    if (err) {
      console.log(err)
      res.sendStatus(500)
    } else {
      res.set('Cache-Control', 'no-cache')
      if (typeof (user.favoriteCourses) !== 'undefined') {
        res.status(200).json(user.favoriteCourses)
      } else {
        res.status(200).json({})
      }
    }
  })
})

// Respond to requests for semester listings
router.get('/semesters', function (req, res) {
  semesterModel.find().sort({_id: -1}).exec(function (err, semesters) {
    if (err) {
      console.log(err)
      res.status(500)
    } else {
      res.set('Cache-Control', 'public, max-age=604800').status(200).json(semesters)
    }
  })
})

router.route('/evaluations/:id/vote').all(function (req, res, next) {
  if (typeof (req.params.id) === 'undefined') {
    res.sendStatus(400)
    return
  }

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
  var user = req.app.get('user')

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
  var user = req.app.get('user')

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

// Export the routes on this router
module.exports.router = router
