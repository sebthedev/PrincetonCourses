var mongoose = require('mongoose')

// This is the schema.  Note the types, validation and trim
// statements.  They enforce useful constraints on the data.
var userSchema = new mongoose.Schema({
  _id: {
    type: String,
    lowercase: true,
    trim: true
  },
  favoriteCourses: [{
    type: Number,
    ref: 'Course'
  }],
  clashDetectionCourses: [{
    type: Number,
    ref: 'Course'
  }]
})

var User = mongoose.model('User', userSchema)

module.exports = User
