var mongoose = require('mongoose')

// This is the schema.  Note the types, validation and trim
// statements.  They enforce useful constraints on the data.
var userSchema = new mongoose.Schema({
  netid: {
    type: String,
    lowercase: true,
    trim: true
  },
  favouriteCourses: [{
    type: Number,
    ref: 'Course'
  }]
})

// Find a user by their netID
userSchema.statics.findByNetid = function (netid, callback) {
  return this.findOne({ netid: netid }, function (error, doc) {
    if (error) {
      console.log('An error occured in findByNetid(). Error: %s', error)
    } else {
      callback(doc)
    }
  })
}

var User = mongoose.model('User', userSchema)

module.exports = User
