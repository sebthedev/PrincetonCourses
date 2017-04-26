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

// Return all of the departments
departmentSchema.statics.getAll = function (callback) {
  this.find().sort({_id: 1}).exec(function (err, departments) {
    if (err) {
      console.log(err)
    } else {
      callback(departments)
    }
  })
}

// Create the Department model from the courseSchema
var Department = mongoose.model('Department', departmentSchema)

// Export the Course model
module.exports = Department
