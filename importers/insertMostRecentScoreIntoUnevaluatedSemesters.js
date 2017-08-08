// Load config variables from the .env file
// require('dotenv').config({path: '../.env'})
require('dotenv').config()

// Load internal modules
var courseModel = require('../models/course.js')
require('../models/semester.js')

// Connect to the database
require('../controllers/database.js')

// Find  all the courses for which scores do not exist or scores is {}
courseModel.find({
  semester: parseInt(process.argv[2]) || {$gt: 0},
  $or: [
    {
      scores: {}
    }, {
      scores: {
        $exists: false
      }
    }, {
      scoresFromPreviousSemester: true
    }
  ]
}, {
  _id: true,
  courseID: true,
  instructors: true,
  semester: true
}).then(function (courses) {
  console.log('Found %d matching courses', courses.length)
  let coursesPending = courses.length
  courses.forEach(function (course, index) {
    let promises = []

    // Find the most recent Overall Quality of the Course score across all the semesters of this course
    promises.push(courseModel.find({
      courseID: course.courseID,
      'scores.Overall Quality of the Course': {
        $exists: true
      },
      scoresFromPreviousSemester: {
        $not: {
          $eq: true
        }
      }
    }, {
      'scores.Overall Quality of the Course': 1,
      courseID: 1,
      'semester': 1
    }).sort({_id: -1}).limit(1).exec())

    // Find the most recent Overall Quality of the Course score taught by this instructor
    if (typeof (course) !== 'undefined' && typeof (course.instructors) !== 'undefined' && course.instructors.length > 0 && (course.instructors[0]._id) !== 'undefined') {
      promises.push(courseModel.find({
        courseID: course.courseID,
        'scores.Overall Quality of the Course': {
          $exists: true
        },
        scoresFromPreviousSemester: {
          $not: {
            $eq: true
          }
        },
        instructors: course.instructors[0]._id
      }, {
        'scores.Overall Quality of the Course': 1,
        courseID: 1,
        'semester': 1
      }).sort({_id: -1}).limit(1).exec())
    }

    Promise.all(promises)/*.then(wait(Math.random() * 30 * 1000))*/.then(function (results) {
      let mostRecentCourseWithRatings
      console.log('Promises resolved (courses pending: %d)', coursesPending)

      // Determine which course evalaution score to use
      if (typeof (results[1]) !== 'undefined' && results[1].length > 0) {
        mostRecentCourseWithRatings = results[1][0]
      } else {
        mostRecentCourseWithRatings = results[0][0]
      }

      // Insert this score into the course in question
      if (typeof (mostRecentCourseWithRatings) !== 'undefined') {
        console.log('About to issue update (courses pending: %d)', coursesPending)
        courseModel.update({
          _id: course._id
        }, {
          scores: {
            'Overall Quality of the Course': mostRecentCourseWithRatings.scores['Overall Quality of the Course']
          },
          scoresFromPreviousSemesterSemester: mostRecentCourseWithRatings.semester._id,
          scoresFromPreviousSemester: true
        }, function (err) {
          if (err) {
            console.log(err)
          } else {
            console.log('Inserted into course', course._id, 'the score', mostRecentCourseWithRatings.scores['Overall Quality of the Course'], 'from', mostRecentCourseWithRatings._id)
            if (--coursesPending === 0) {
              console.log('Done')
              process.exit(0)
            }
          }
        })
      } else {
        if (--coursesPending === 0) {
          console.log('Done')
          process.exit(0)
        }
      }
    }).catch(function (reason) {
      console.log(reason)
      process.exit(0)
    })
  })
}).catch(function (reason) {
  console.log(reason)
  process.exit(0)
})
