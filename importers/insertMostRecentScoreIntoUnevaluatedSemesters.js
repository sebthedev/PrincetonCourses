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
}).then(function (courses) {
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

    Promise.all(promises).then(function (results) {
      let mostRecentCourseWithRatings

      // Determine which course evalaution score to use
      if (typeof (results[1]) !== 'undefined' && results[1].length > 0) {
        mostRecentCourseWithRatings = results[1]
      } else {
        mostRecentCourseWithRatings = results[0]
      }

      // Insert this score into the course in question
      if (typeof (mostRecentCourseWithRatings[0]) !== 'undefined') {
        courseModel.update({
          _id: course._id
        }, {
          scores: {
            'Overall Quality of the Course': mostRecentCourseWithRatings[0].scores['Overall Quality of the Course']
          },
          scoresFromPreviousSemesterSemester: mostRecentCourseWithRatings[0].semester._id,
          scoresFromPreviousSemester: true
        }, function (err) {
          if (err) {
            console.log(err)
          } else {
            console.log('Inserted into course', course._id, 'the score', mostRecentCourseWithRatings[0].scores['Overall Quality of the Course'], 'from', mostRecentCourseWithRatings[0]._id)
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

/*

courseModel.distinct('courseID', {
  department: 'COS',
  catalogNumber: '432',
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
}, function (err, courseIDs) {
  if (err) {
    console.log(err)
  }

  // Iterate over all the coursesIDs
  for (var courseIDIndex in courseIDs) {
    var courseID = courseIDs[courseIDIndex]

    let promises = []

    // Find the most recent Overall Quality of the Course score across all the semesters of this course
    promises.push(courseModel.find({
      courseID: courseID,
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
      courseID: 1
    }).sort({_id: -1}).limit(1).exec())

    Promise.all(promises).then(function (results) {
      let result = results[0]
      console.log(result)

      // If a score exists, update the main course with this ID
      if (typeof (result[0]) !== 'undefined') {
        courseModel.update({
          courseID: result[0].courseID,
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
          scores: {
            'Overall Quality of the Course': result[0].scores['Overall Quality of the Course']
          },
          scoresFromPreviousSemester: true
        }, function (err) {
          if (err) {
            console.log(err)
          } else {
          // console.log('Completed ' + Math.random())
          }
        })
      }
    }).catch(function (reason) {
      console.log(reason)
      process.exit(0)
    })
  }
}) */
