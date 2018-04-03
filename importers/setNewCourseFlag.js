// Load config variables from the .env file
// require('dotenv').config({path: '../.env'})
require('dotenv').config()

// Load internal modules
var courseModel = require('../models/course.js')

// Connect to the database
require('../controllers/database.js')

courseModel.distinct('courseID', {'scores.Quality of Course': {$exists: false}}).then(async function (courseIDs) {
  console.log(`Setting new flag on ${courseIDs.length} courses`)
  const promises = []
  for (const courseID of courseIDs) {
    const count = await courseModel.count({courseID: courseID})
    if (count === 1) {
      promises.push(courseModel.update({
        courseID: courseID
      }, {
        new: true
      }).exec())
    }
  }
  return Promise.all(promises)
}).then(result => {
  console.log('Done!')
  process.exit(0)
}).catch(err => {
  return console.error(err)
})
