// Load config variables from the .env file
// require('dotenv').config({path: '../.env'})
require('dotenv').config()


// Load internal modules
var courseModel = require('../models/course.js')
require('../models/semester.js')

// Connect to the database
require('../controllers/database.js')

// Find the _ids of all the courses for which scores do not exist or scores is {}
courseModel.distinct('courseID', {
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

    // Find the most recent Overall Quality of the Course score across all the semesters of this course
    courseModel.find({
      courseID: courseID,
      'scores.Overall Quality of the Course': {
        $exists: true
      }
    }, {
      'scores.Overall Quality of the Course': 1,
      courseID: 1
    }).sort({_id: -1}).limit(1).exec(function (err, result) {
      if (err) {
        console.log(err)
      }

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
    })
  }
})
