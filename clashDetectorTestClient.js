
require('dotenv').config()

// Load internal modules
require('./database.js')
require('./semester.js')
var courseModel = require('./course.js')
var clashDetector = require('./courseClashDetector.js')

courseModel.find({department: 'COS', semester: 1174}, function (err, courses) {
  if (err) {
    console.log(err)
  } else {
    courseModel.find({catalogNumber: '201', semester: 1174}, function (err, favoriteCourses) {
      if (err) {
        console.log(err)
      } else {
        console.log(clashDetector.detectClash(favoriteCourses, courses, false))
      }
    })
  }
})
