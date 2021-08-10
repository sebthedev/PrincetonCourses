// Handle requests to the /search API endpoint

// Load Express
let express = require('express')
let router = express.Router()

// Load internal modules
let courseModel = require.main.require('./models/course.js')
let courseClashDetector = require.main.require('./controllers/courseClashDetector.js')
let instructorModel = require.main.require('./models/instructor.js')
let userModel = require.main.require('./models/user.js')
let departmentModel = require.main.require('./models/department.js')

// Load the departments once from the database
let departments = []
departmentModel.getAll(function (fetchedDepartments) {
  departments = fetchedDepartments
})

// Intelligent searching for both courses and instructors
router.use('/:query', function (req, res) {
  // Validate that the request contains a query
  if (typeof (req.params.query) === 'undefined') {
    res.sendStatus(400)
    return
  }

  // Initialise the queries and projections for the courses and instructors searches
  let courseQuery = {}
  let courseProjection = {}
  let instructorQuery = {}
  let instructorProjection = {}

  // Perform filtering based on explicit keywords
  let queryWords = req.params.query.split(' ')
  var newQueryWords = []
  const distributionAreas = ['CD', 'QCR', 'SEL', 'SEN', 'EC', 'EM', 'HA', 'LA', 'SA', 'QR', 'STL', 'STN']
  const distributionCorresp = {
    'QCR':'QR',
    'QR' :'QCR',
    'SEL':'STL',
    'STL':'SEL',
    'SEN':'STN',
    'STN':'SEN'
  }
  const courseDeptNumberRegexp = /([A-Z]{3})(\d{1,3})/
  const catalogNumberLevel = /\dXX/i
  let departmentsQueried = []
  let catalogNumberQueriedLevels = []
  queryWords.forEach(function (thisQueryWord) {
    thisQueryWord = thisQueryWord.toUpperCase()
    let matches

    // Determine whether thisQueryWord is a department code
    let isDepartment = thisQueryWord.length === 3 && departments.some(function (department) {
      return department._id === thisQueryWord
    })

    // Check for distribution areas, pdf status, and wildcards
    if (distributionAreas.indexOf(thisQueryWord) > -1) {
      if (!courseQuery.hasOwnProperty('distribution')) {
        courseQuery.distribution = {
          '$in': []
        }
      }
      courseQuery.distribution['$in'].push(new RegExp(thisQueryWord))
      if(distributionCorresp.hasOwnProperty(thisQueryWord)) {
        courseQuery.distribution['$in'].push(new RegExp(distributionCorresp[thisQueryWord]))
      }
    } else if (isDepartment) {
      departmentsQueried.push(thisQueryWord)
    } else if (thisQueryWord === 'PDF') {
      courseQuery['pdf.permitted'] = true
    } else if (thisQueryWord === 'NPDF') {
      courseQuery['pdf.permitted'] = false
    } else if (thisQueryWord === 'PDFO') {
      courseQuery['pdf.required'] = true
    } else if (thisQueryWord === 'NEW') {
      courseQuery['new'] = true
    } else if (thisQueryWord === 'AUDIT') {
      courseQuery['audit'] = true
    } else if (thisQueryWord === 'NAUDIT') {
      courseQuery['audit'] = false
    } else if (thisQueryWord === 'UGRD') {
      courseQuery['track'] = 'UGRD'
    } else if (thisQueryWord === 'GRAD') {
      courseQuery['track'] = 'GRAD'
    } else if ((matches = catalogNumberLevel.exec(thisQueryWord)) !== null) {
      catalogNumberQueriedLevels.push(parseInt(matches[0].charAt(0)) * 100)
    } else if ((matches = courseDeptNumberRegexp.exec(thisQueryWord)) !== null) {
      // Expand "COS333" to "COS 333"
      newQueryWords.push(matches[1], matches[2])
    } else if (thisQueryWord !== '*' && thisQueryWord.length > 0) {
      newQueryWords.push(thisQueryWord)
    }
  })

  // Allow filtering by departments
  if (departmentsQueried.length > 0) {
    if (!courseQuery.hasOwnProperty('$and')) {
      courseQuery['$and'] = []
    }
    courseQuery['$and'].push({
      $or: [
        {
          department: {
            $in: departmentsQueried
          }
        },
        {
          'crosslistings.department': {
            $in: departmentsQueried
          }
        }
      ]
    })
  }

  // Allow filtering by catalog number level
  if (catalogNumberQueriedLevels.length > 0) {
    if (!courseQuery.hasOwnProperty('$and')) {
      courseQuery['$and'] = []
    }
    let catalogNumberQueriedLevelsConstructed = catalogNumberQueriedLevels.map(function (level) {
      return {
        $and: [
          {
            catalogNumber: {
              $gte: level
            }
          },
          {
            catalogNumber: {
              $lt: level + 100
            }
          }
        ]
      }
    })
    courseQuery['$and'].push({
      $or: catalogNumberQueriedLevelsConstructed
    })
  }

  // Build the database queries and projections for searching for courses and instructors
  if (newQueryWords.length > 0) {
    // Prepend each query word with the regex word boundary token so that searching matches only the beginning of words
    let prependedNewQueryWords = newQueryWords.map(function (word) {
      return '\\b' + word
    })

    // Construct a query that performs a regex-based search looking for courses that contain at least one of the query words in at least one of the search fields
    const queryRegex = new RegExp(prependedNewQueryWords.join('|'), 'i')
    const courseTextSearchQuery = {
      $or: [
        {'title': queryRegex},
        {'department': queryRegex},
        {'catalogNumber': queryRegex},
        {'crosslistings.department': queryRegex},
        {'crosslistings.catalogNumber': queryRegex}
      ]
    }

    // Insert the courseTextSearchQuery into the main courseQuery object
    if (typeof (courseQuery['$or']) !== 'undefined') {
      courseTextSearchQuery['$or'].forEach(function (alternative) {
        courseTextSearchQuery['$or'].push(alternative)
      })
    } else {
      Object.assign(courseQuery, courseTextSearchQuery)
    }

    // Insert the MongoDB full-text search query and projections into the instructor query and projectio
    Object.assign(instructorQuery, {
      $text: {
        $search: newQueryWords.join(' ')
      }
    })
    Object.assign(instructorProjection, {
      relevance: {
        $meta: 'textScore'
      }
    })
  }

  // Filter courses by semester
  if (typeof (req.query.semester) !== 'undefined' && !isNaN(req.query.semester)) {
    courseQuery.semester = parseInt(req.query.semester)
  }

  // Determine whether the user has asked that we detect clashes with favorite courses
  let detectClashes = req.query.hasOwnProperty('detectClashes') && req.query.detectClashes !== 'false' && courseQuery.hasOwnProperty('semester')
  let filterOutClashes = detectClashes && req.query.detectClashes === 'filter'

  let promises = []
  let promiseNames = []

  if (detectClashes) {
    // Remove the projection parameter that may be supressing the display of classes
    delete courseProjection.classes

    // Construct the userModel database query to get the user's favorite courses
    promises.push(userModel.findById(res.locals.user._id, {
      'clashDetectionCourses': 1
    }).populate('clashDetectionCourses').exec())
    promiseNames.push('user')
  }

  // Construct the courseModel database query as a promise
  promises.push(courseModel.find(courseQuery, courseProjection).exec())
  promiseNames.push('courses')

  // Construct the instructorModel database query as a promise
  if (newQueryWords.length > 0) {
    promises.push(instructorModel.find(instructorQuery, instructorProjection).exec())
    promiseNames.push('instructors')
  }

  // Trigger both promises and wait for them to both return
  Promise.all(promises).then(values => {
    // Retrieve the promises' results
    let courses = values[promiseNames.indexOf('courses')]
    if (promiseNames.indexOf('instructors') > -1) {
      var instructors = values[promiseNames.indexOf('instructors')]
    }

    if (promiseNames.indexOf('user') > -1) {
      let user = values[promiseNames.indexOf('user')].toObject()
      if (user.hasOwnProperty('clashDetectionCourses')) {
        var clashDetectionCourses = user.clashDetectionCourses
      }
    }

    // Guard against the query results being null
    if (typeof (courses) === 'undefined' || courses.length === 0) {
      courses = []
    }
    if (typeof (instructors) === 'undefined' || instructors.length === 0) {
      instructors = []
    }

    // Filter returned courses to include only the courses that include all of the query terms
    // Define the properties in which all of the query terms must occur
    const filteringProperties = ['title', 'department', 'catalogNumber']
    courses = courses.filter(function (thisCourse) {
      thisCourse = thisCourse.toObject()

      // Concatenate the course's relevant filtering properties into a single string
      let courseDetailsConcatenation = []
      filteringProperties.forEach(function (filteringProperty) {
        if (thisCourse.hasOwnProperty(filteringProperty)) {
          courseDetailsConcatenation.push(thisCourse[filteringProperty])
        }
      })
      if (thisCourse.hasOwnProperty('crosslistings')) {
        thisCourse.crosslistings.forEach(function (crosslisting) {
          courseDetailsConcatenation.push(crosslisting.department)
          courseDetailsConcatenation.push(crosslisting.catalogNumber)
        })
      }
      courseDetailsConcatenation = courseDetailsConcatenation.join(' ').toUpperCase()

      // Check whether all of the query words are in the courseDetailsConcatenation
      let passingWords = 0
      newQueryWords.forEach(function (queryWord) {
        let re = new RegExp('\\b' + queryWord)
        if (re.test(courseDetailsConcatenation)) {
          passingWords++
        }
      })
      return passingWords === newQueryWords.length
    })

    // Convert Mongoose objects to regular JavaScript objects
    courses = courses.map(function (course) {
      return course.toObject()
    })

    // Determine the relevance of each course to the entered query
    const scoringProperties = [
      {
        property: 'title',
        weight: 1
      },
      {
        property: 'department',
        weight: 2
      },
      {
        property: 'catalogNumber',
        weight: 1.5
      }
    ]
    courses.forEach(function (course, index) {
      courses[index].relevance = 0
      scoringProperties.forEach(function (scoringProperty) {
        newQueryWords.forEach(function (queryWord) {
          if (typeof (course[scoringProperty.property]) !== 'undefined') {
            let matches = course[scoringProperty.property].match(new RegExp('\\b' + queryWord, 'i'))
            if (matches != null) {
              courses[index].relevance += matches.length * scoringProperty.weight
            }
          }
        })
      })
    })

    // Detect clashes
    if (detectClashes) {
      var detectClashesResult = courseClashDetector.detectCourseClash(clashDetectionCourses, courses, parseInt(courseQuery.semester))
      if (detectClashesResult.hasOwnProperty('status')) {
        if (detectClashesResult.status === 'success') {
          courses = detectClashesResult.courses
        } else if (detectClashesResult.status === 'favoritesClash' && courses.length > 0) {
          for (let courseIndex in courses) {
            courses[courseIndex].favoritesClash = true
          }
        }
      }
    }

    // Filter out clashing courses if requested by the client
    if (filterOutClashes) {
      courses = courses.filter(function (thisCourse) {
        return typeof (thisCourse.clash) === 'undefined' || thisCourse.clash === false
      })
    }

    // Iterate over courses
    for (var i in courses) {
      // Note that this object is of type 'course'
      courses[i].type = 'course'
    }

    // Iterate over instructors
    for (var j in instructors) {
      // Convert the Mongoose object into a regular object
      instructors[j] = instructors[j].toObject()

      // Note that this object is of type 'instructor'
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
      if (typeof (a.scores) === 'undefined' || typeof (a.scores['Quality of Course']) === 'undefined') {
        return 1
      }
      if (typeof (b.scores) === 'undefined' || typeof (b.scores['Quality of Course']) === 'undefined') {
        return -1
      }

      // Return the difference between the scores
      return b.scores['Quality of Course'] - a.scores['Quality of Course']
    })

    // Send the result to the client
    res.set('Cache-Control', 'no-cache').json(combinedResult)
  }).catch(reason => {
    console.log(reason)
    res.sendStatus(500)
  })
})

module.exports = router
