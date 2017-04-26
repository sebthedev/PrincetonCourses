// This script is a model of the Semester object

// Load external dependencies
var mongoose = require('mongoose')

// Define the semesterSchema
var semesterSchema = new mongoose.Schema({
  _id: Number,
  name: String,
  start_date: String,
  end_date: String
}, {
  toObject: {
    versionKey: false
  },
  toJSON: {
    versionKey: false
  }
})

// Return all of the departments
semesterSchema.statics.getAll = function (callback) {
  this.find().sort({_id: -1}).exec(function (err, semesters) {
    if (err) {
      console.log(err)
    } else {
      callback(semesters)
    }
  })
}

// Create the Semester model from the courseSchema
var Semester = mongoose.model('Semester', semesterSchema)

// Export the Course model
module.exports = Semester
