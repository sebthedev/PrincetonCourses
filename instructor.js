// This script is a model of the Instructor object

// Load external dependencies
var mongoose = require('mongoose')

// Define the instructorSchema
var instructorSchema = new mongoose.Schema({
  _id: Number,
  name: {
    first: String,
    last: String
  },
  courses: [{
    type: Number,
    ref: 'Course'
  }]
})

// Create the virtual fullName property
instructorSchema.virtual('fullName').get(function () {
  return this.firstName + ' ' + this.name.last
})

instructorSchema.statics.upsertInstructor = function (emplid, firstName, lastName) {
  var instructorModel = mongoose.model('Instructor', instructorSchema)

  instructorModel.findOneAndUpdate({
    _id: emplid
  }, {
    _id: emplid,
    name: {
      first: firstName,
      last: lastName
    }
  }, {
    new: true,
    upsert: true
  }, function (error) {
    if (error) {
      console.log('In upsertInstructor upserting instructor failed: %s', error)
    }
  })
}

instructorSchema.statics.upsertInstructorWithCourse = function (emplid, firstName, lastName, courseID) {
  var instructorModel = mongoose.model('Instructor', instructorSchema)

  instructorModel.findOneAndUpdate({
    _id: emplid
  }, {
    _id: emplid,
    name: {
      first: firstName,
      last: lastName
    },
    $addToSet: {
      courses: courseID
    }
  }, {
    new: true,
    upsert: true
  }, function (error) {
    if (error) {
      console.log('In upsertInstructorWithCourse upserting instructor failed: %s', error)
    }
  })
}

// Create the Instructor model from the courseSchema
var Instructor = mongoose.model('Instructor', instructorSchema)

// Export the Course model
module.exports = Instructor
