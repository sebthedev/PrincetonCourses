// Load config variables from the .env file
// require('dotenv').config({path: '../.env'})
require('dotenv').config()

// Load internal modules
var courseModel = require('../models/course.js')
var semesterModel = require('../models/semester.js')

// Connect to the database
require('../controllers/database.js')

var promises = []

// Get the most recent semester
promises.push(semesterModel.find({}).sort({_id: -1}).limit(1).exec())

promises.push(courseModel.distinct('courseID', {}).exec())

Promise.all(promises).then(function (results) {
  let mostRecentSemester = results[0][0]
  let courseIDs = results[1]

  for (let courseIDIndex in courseIDs) {
    let thisCourseID = courseIDs[courseIDIndex]
    console.log('Considering course with ID %s.', thisCourseID)

    courseModel.find({courseID: thisCourseID}, function (err, courses) {
      if (err) {
        console.log(err)
        process.exit(1)
      }
      console.log('Got result for course ID ', thisCourseID)
      if (courses.length === 1 && courses[0].semester._id === mostRecentSemester._id) {
        courses[0].update({
          $set: {
            new: true
          }
        }, function (err) {
          if (err) {
            console.log(err)
          }
          console.log('Set new to true on course %d.', courses[0]._id)
        })
      } else {
        courseModel.update({
          courseID: courses[0].courseID
        }, {
          new: false
        }, function (err) {
          if (err) {
            console.log(err)
          }
          console.log('Set new to false on all courses with courseID %s.', courses[0].courseID)
        })
      }
    })
  }
}).catch(function (reason) {
  console.log(reason)
})
