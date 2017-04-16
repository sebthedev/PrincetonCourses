// To run this test client, at the command prompt run "node clashDetectorTestClient.js"

// Load environment variables
require('dotenv').config()

// Load internal modules
require('./controllers/database.js')
require('./models/semester.js')
var courseModel = require('./models/course.js')
var userModel = require('./models/user.js')
var clashDetector = require('./courseClashDetector.js')

// Greet the user
console.log('Testing the Course Clash Detector')

// Define an database query that will yield an array of courses that will be compared against the favorite courses for clashes
const comparisonCoursesQuery = {
  catalogNumber: '201',
  semester: 1182
}

// Execute the database queries
let userPromise = userModel.findById('smclarke').populate('favoriteCourses').exec()
let comparisonCoursesPromise = courseModel.find(comparisonCoursesQuery).exec()

// Wait for both of the database queries to return
Promise.all([userPromise, comparisonCoursesPromise]).then(function (results) {
  let user = results[0].toObject()
  let courses = results[1]

  // Check the user has a favoriteCourses array
  if (!user.hasOwnProperty('favoriteCourses')) {
    console.log('User has no favoriteCourses array')
    process.exit(0)
  }

  // Extract the user's favorite courses
  let favoriteCourses = user.favoriteCourses

  console.log('%s\'s favorite courses are:', user._id)
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
  var clashDetectorResponse = clashDetector.detectCourseClash(favoriteCourses, courses, 1182)

  if (clashDetectorResponse.status !== 'success') {
    console.log(clashDetectorResponse.status)
  } else {
    console.log('Clash results:')
    for (let courseIndex in clashDetectorResponse.courses) {
      let thisCourse = clashDetectorResponse.courses[courseIndex]
      console.log('\t' + thisCourse.commonName, thisCourse.semester.name, 'Clash:', thisCourse.clash)
    }
  }

  process.exit(0)
}).catch(function (reason) {
  console.log(reason)
  process.exit(0)
})
