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
  upvotedEvaluations: [{
    type: String,
    ref: 'Evaluation'
  }],
  downvotedEvaluations: [{
    type: String,
    ref: 'Evaluation'
  }]
})

var User = mongoose.model('User', userSchema)

module.exports = User
