var express = require('express')
var router = express.Router()

// Load internal modules
var auth = require('./authentication.js')
var courseModel = require('./course.js')
var semesterModel = require('./semester.js')
var instructorModel = require('./instructor.js')

// Check that the user is authenticated
router.all('*', function (req, res, next) {
  if (!auth.userIsAuthenticated(req)) {
    res.sendStatus(403)
  } else {
    next()
  }
})

// Respond to requests for course listings
router.post('/courses', function (req, res) {
  // Check the request contains a query
  if (typeof (req.body.query) === 'undefined') {
    res.sendStatus(400)
  }

  var query = {}
  var projection = {}
  var sort = {}

  // Parse the request's query
  // If the request's query is a string, use this in a full-text search for courses.
  // If the request's query is an object treat this as the database query
  // Otherwise the request is malformed and this is an error
  var parsedRequestQuery = JSON.parse(req.body.query)
  if (typeof (parsedRequestQuery) === 'string') {
    query = {
      $text: {
        $search: parsedRequestQuery
      }
    }
    projection = {
      relevance: {
        $meta: 'textScore'
      }
    }
  } else if (typeof (parsedRequestQuery) === 'object') {
    query = parsedRequestQuery
    if (typeof (parsedRequestQuery['$text']) !== 'undefined') {
      projection = {
        relevance: {
          $meta: 'textScore'
        }
      }
    }
  } else {
    res.sendStatus(400)
    return
  }

  // By default, sort by relevance. Allow sorting by title or department
  sort = {
    relevance: {
      $meta: 'textScore'
    },
    department: 1,
    catalogNumber: 1
  }
  if (typeof (req.body.sort) === 'string') {
    if (['title', 'department'].indexOf(req.body.sort) > -1) {
      sort = {}
      sort[req.body.sort] = 1
    } else if (req.body.sort === 'rating') {
      sort = {
        'evaluations.scores.Overall Quality of the Course': -1
      }
    } else if (req.body.sort === 'code') {
      sort = {
        department: 1,
        catalogNumber: 1
      }
    }
  }

  // Send the query to the database and return a JSON array of the results
  courseModel.find(query, projection).sort(sort).exec(function (err, courses) {
    if (err) {
      console.log(err)
      res.sendStatus(500)
    } else {
      res.json(courses)
    }
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
        res.json(instructor)
      }
    }
  })
})

// Respond to requests to add a course to the user's favoriteCourses list
router.put('/user/favorite', function (req, res) {
  var user = req.app.get('user')

  // Check that the request contains a course to delete
  if (typeof (req.body.course) === 'undefined') {
    res.sendStatus(400)
    return
  }

  // Check that this user has a favoriteCourses array
  if (typeof (user.favoriteCourses) === 'undefined') {
    user.favoriteCourses = []
  }

  // If this course is not already in the favoriteCourses array, add it
  if (user.favoriteCourses.indexOf(req.body.course) === -1) {
    user.favoriteCourses.push(req.body.course)

    user.save(function (error) {
      if (error) {
        console.log(error)
        res.sendStatus(500)
      }
      res.sendStatus(201)
    })
  } else {
    res.sendStatus(200)
  }
})

// Respond requests to delete a course from the user's favoriteCourses list
router.delete('/user/favorite', function (req, res) {
  var user = req.app.get('user')

  // Check that this user has a favoriteCourses array
  if (typeof (user.favoriteCourses) === 'undefined') {
    res.sendStatus(200)
    return
  }

  // Check that the request contains a course to delete
  if (typeof (req.body.course) === 'undefined') {
    res.sendStatus(400)
    return
  }

  // If the requested course is in the favoriteCourses array, remove it
  var i = user.favoriteCourses.indexOf(req.body.course)
  if (i !== -1) {
    user.favoriteCourses.splice(i, 1)

    user.save(function (error) {
      if (error) {
        console.log(error)
        res.sendStatus(500)
        return
      }
      res.sendStatus(200)
      return
    })
  } else {
    res.sendStatus(200)
  }
})

// Respond to a request for a list of this user's favorite courses
router.get('/user/favorites', function (req, res) {
  req.app.get('user').populate('favoriteCourses', function (err, user) {
    if (err) {
      console.log(err)
      res.sendStatus(500)
    } else {
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
  semesterModel.getAllSemesters(function (semesters) {
    res.status(200).json(semesters)
  })
})

// Export the routes on this router (/login, /verify, and /logout)
module.exports.router = router
