// This script is a model of the Department object

// Load external dependencies
var mongoose = require('mongoose')

// Define the departmentSchema
var departmentSchema = new mongoose.Schema({
  _id: {
    type: String,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  }
}, {
  toObject: {
    versionKey: false
  },
  toJSON: {
    versionKey: false
  }
})

// Create the Department model from the courseSchema
var Department = mongoose.model('Department', departmentSchema)

// Export the Course model
module.exports = Department
