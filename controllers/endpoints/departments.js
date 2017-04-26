// Handle requests to the /departments API endpoint

// Load Express
let express = require('express')
let router = express.Router()

// Load internal modules
let departmentModel = require.main.require('./models/department.js')

// Load the departments once from the database
let departments = []
departmentModel.getAll(function (fetchedDepartments) {
  departments = fetchedDepartments
})

// Respond to requests for semester listings
router.use(function (req, res) {
  res.set('Cache-Control', 'public, max-age=604800').status(200).json(departments)
})

module.exports = router
