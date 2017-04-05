// This script is a model of the Evaluation object

// Load external dependencies
var mongoose = require('mongoose')

// Define the evaluationSchema
var evaluationSchema = new mongoose.Schema({
  comment: {
    type: String,
    required: true,
    trim: true
  },
  votes: {
    type: Number,
    default: 0
  },
  course: {
    required: true,
    type: String,
    ref: 'Course',
    index: true
  }
}, {
  toObject: {
    versionKey: false
  }
})

// Create the Evaluation model from the courseSchema
var Evaluation = mongoose.model('Evaluation', evaluationSchema)

// Export the Course model
module.exports = Evaluation
