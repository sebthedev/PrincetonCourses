// Load config variables from the .env file
require('dotenv').config({path: '../.env'})

// Load internal modules
var courseModel = require('../models/course.js')
require('../models/semester.js')

// Connect to the database
require('../controllers/database.js')

var id = 1174002065 + ''
var courseID = id.substring(4)
courseModel.find({
  courseID: courseID,
  'scores.Overall Quality of the Course': {
    $exists: true
  }
}, {
  'scores.Overall Quality of the Course': 1
}).sort({_id: -1}).limit(1).exec(function (err, result) {
  if (err) {
    console.log(err)
  }
  if (typeof (result[0]) !== 'undefined') {
    console.log(parseInt(id))
    console.log(result[0].scores['Overall Quality of the Course'])
    courseModel.findByIdAndUpdate(parseInt(id), {
      scores: {
        'Overall Quality of the Course': result[0].scores['Overall Quality of the Course']
      },
      scoresFromPreviousSemester: true
    }, function (err) {
      console.log(err)
      console.log('done')
    })
  }
})

courseModel.distinct('_id', {
  $or: [
    {
      scores: {}
    }, {
      scores: {
        $exists: false
      }
    }
  ]
}, function (err, IDs) {
  if (err) {
    console.log(err)
  }
  for (var i in IDs) {
    var id = IDs[i] + ''
    var courseID = id.substring(4)
    courseModel.find({
      courseID: courseID,
      'scores.Overall Quality of the Course': {
        $exists: true
      }
    }, {
      'scores.Overall Quality of the Course': 1
    }).sort({_id: -1}).limit(1).exec(function (err, result) {
      if (err) {
        console.log(err)
      }
      if (typeof (result[0]) !== 'undefined') {
        courseModel.findByIdAndUpdate(parseInt(id), {
          scores: {
            'Overall Quality of the Course': result[0].scores['Overall Quality of the Course']
          },
          scoresFromPreviousSemester: true
        }, function (err) {
          if (err) {
            console.log(err)
          } else {
            console.log('Completed ' + Math.random())
          }
        })
      }
    })
  }
})
