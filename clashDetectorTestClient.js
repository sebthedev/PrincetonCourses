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
        console.log("Favorite Courses [Department] 333")
        for (courseIndex in favoriteCourses) {
          console.log(favoriteCourses[courseIndex].department)
        }
        var clashDetectorResponse = clashDetector.detectCourseClash(favoriteCourses, courses, true)
        console.log("Course Search Clash Results")
        for (var i = 0; i < clashDetectorResponse.length; i++) {
          console.log(clashDetectorResponse[i].title)
          console.log(clashDetectorResponse[i].clash)
        }
        process.exit(0)
      }
    })
  }
})
