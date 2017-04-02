// Load config variables from the .env file
require('dotenv').config()

// Load internal modules
var courseModel = require('../models/course.js')

// Connect to the database
require('./database.js')

// Retrieve an array of all the courses for each semester.
courseModel.aggregate([
  {
    $group: { _id: '$courseID', semesters: {$addToSet: '$semester'} }
  }
], function (err, coursesWithSemesters) {
  if (err) {
    console.log(err)
  }

  // Increment the number of courses pending processing
  var coursesPendingProcessing = coursesWithSemesters.length

  for (var i in coursesWithSemesters) {
    var info = coursesWithSemesters[i]
    console.log('Updating %s', info._id)
    courseModel.updateMany({
      'courseID': info._id
    }, {
      '$set': {'semesters': info.semesters}
    }, function (err, course) {
      if (err) {
        console.log(err)
      }
      console.log('Courses pending processing %d', coursesPendingProcessing)
      coursesPendingProcessing--
      if (coursesPendingProcessing === 0) {
        console.log('Done!')
        process.exit()
      }
    })
  }
})
