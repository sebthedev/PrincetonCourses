// To run this test client, at the command prompt run "node clashDetectorTestClient.js"

// Load environment variables
require('dotenv').config()

// Load internal modules
require('./database.js')
require('./semester.js')
var courseModel = require('./course.js')
var clashDetector = require('./courseClashDetector.js')

// Greet the user
console.log('Testing the Course Clash Detector')

// Define an database query that will yield an array of courses to be used as the "Favorite Courses" list
const favoriteCoursesQuery = {
  catalogNumber: '333',
  semester: 1174
}

// Define an database query that will yield an array of courses that will be compared against the favorite courses for clashes
const comparisonCoursesQuery = {
  catalogNumber: '201',
  semester: 1174
}

// Execute the database queries
let favoriteCoursesPromise = courseModel.find(favoriteCoursesQuery).exec()
let comparisonCoursesPromise = courseModel.find(comparisonCoursesQuery).exec()

// Wait for both of the database queries to return
Promise.all([favoriteCoursesPromise, comparisonCoursesPromise]).then(function (results) {
  let favoriteCourses = results[0]
  let courses = results[1]

  console.log('The user\'s favorite courses are:')
  for (let courseIndex in favoriteCourses) {
    let thisCourse = favoriteCourses[courseIndex]
    console.log('\t' + thisCourse.commonName, thisCourse.semester.name)
  }

  console.log('We will determine whether any of the following courses clash with the user\'s favorite courses:')
  for (let courseIndex in courses) {
    let thisCourse = courses[courseIndex]
    console.log('\t' + thisCourse.commonName, thisCourse.semester.name)
  }

  // Enquire about the clash status of the courses
  var clashDetectorResponse = clashDetector.detectCourseClash(favoriteCourses, courses, true)

  console.log('Clash results:')
  for (let courseIndex in clashDetectorResponse) {
    let thisCourse = clashDetectorResponse[courseIndex]
    console.log('\t' + thisCourse.commonName, thisCourse.semester.name, 'Clash:', thisCourse.clash)
  }

  process.exit(0)
}).catch(function (reason) {
  console.log(reason)
  process.exit(0)
})
