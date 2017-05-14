// Handle requests to the /semesters API endpoint

// Load Express
let express = require('express')
let router = express.Router()

// Load internal modules
let semesterModel = require.main.require('./models/semester.js')

// Load the departments once from the database
let semesters = []
semesterModel.getAll(function (fetchedSemesters) {
  semesters = fetchedSemesters
})

// Respond to requests for semester listings
router.use(function (req, res) {
  res.set('Cache-Control', 'public, max-age=604800').status(200).json(semesters)
})

module.exports = router
