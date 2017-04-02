// This script is a model of the Semester object

// Load external dependencies
var mongoose = require('mongoose')

// Define the semesterSchema
var semesterSchema = new mongoose.Schema({
  _id: Number,
  name: String,
  start_date: String,
  end_date: String
})

// Create the Semester model from the courseSchema
var Semester = mongoose.model('Semester', semesterSchema)

// Export the Course model
module.exports = Semester
