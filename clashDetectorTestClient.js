// To run this test client, at the command prompt run "node clashDetectorTestClient.js"

require('dotenv').config()

// Load internal modules
require('./database.js')
require('./semester.js')
var courseModel = require('./course.js')
var clashDetector = require('./courseClashDetector.js')

courseModel.find({catalogNumber: '201', semester: 1174}, function (err, courses) {
  if (err) {
    console.log(err)
  } else {
    courseModel.find({catalogNumber: '333', semester: 1174}, function (err, favoriteCourses) {
      if (err) {
        console.log(err)
      } else {
        for (courseIndex in courses) {
          console.log(courses[courseIndex].department)
        }
        for (courseIndex in favoriteCourses) {
          console.log(favoriteCourses[courseIndex].department)
        }
        var clashDetectorResponse = clashDetector.detectCourseClash(favoriteCourses, courses, true)
        process.exit(0)
      }
    })
  }
})
