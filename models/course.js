// This script is a model of the Course object

// Load external dependencies
var mongoose = require('mongoose')
var instructorModel = require('./instructor.js')
require('./evaluation.js')

// Define the courseSchema
var courseSchema = new mongoose.Schema({
  _id: Number,
  courseID: {
    type: String,
    index: true
  },
  catalogNumber: {
    type: String,
    trim: true,
    uppercase: true
  },
  title: {
    type: String,
    trim: true
  },
  semester: {
    type: Number,
    ref: 'Semester'
  },
  readings: [{
    title: {
      type: String,
      trim: true
    },
    author: {
      type: String,
      trim: true
    },
    _id: false
  }],
  department: {
    type: String,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  classes: [],
  instructors: [{
    type: Number,
    ref: 'Instructor'
  }],
  crosslistings: [{
    department: {
      type: String,
      uppercase: true,
      trim: true
    },
    catalogNumber: {
      type: String,
      trim: true,
      uppercase: true
    }
  }],
  scores: {},
  scoresFromPreviousSemester: Boolean,
  distribution: {
    type: String,
    uppercase: true,
    trim: true
  },
  pdf: {
    permitted: Boolean,
    required: Boolean
  },
  audit: Boolean,
  assignments: [String],
  grading: Array,
  prerequisites: {
    type: String,
    trim: true
  },
  equivalentcourses: {
    type: String,
    trim: true
  },
  otherinformation: {
    type: String,
    trim: true
  },
  otherrequirements: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  track: {
    type: String,
    trim: true,
    uppercase: true
  },
  new: Boolean
}, {
  toObject: {
    virtuals: true,
    versionKey: false
  },
  toJSON: { virtuals: true },
  id: false
})

courseSchema.virtual('commonName').get(function () {
  return this.department + ' ' + this.catalogNumber
})

// Virtually connect the course to its comments
courseSchema.virtual('comments', {
  ref: 'Evaluation',
  localField: '_id',
  foreignField: 'course'
})

// Create an index on this schema which allows for awesome weighted text searching
courseSchema.index({
  title: 'text',
  description: 'text',
  department: 'text',
  catalogNumber: 'text',
  'crosslistings.department': 'text',
  'crosslistings.catalogNumber': 'text'
}, {
  'weights': {
    title: 10,
    description: 1,
    department: 20,
    catalogNumber: 10,
    distribution: 10,
    'crosslistings.department': 15,
    'crosslistings.catalogNumber': 8
  },
  name: 'CourseRelevance',
  language: 'none'
})

// Catch errors when creating the textindex
courseSchema.on('index', function (error) {
  if (error) {
    console.log(error.message)
  }
})

// Automatically populate instructors and semester
var autoPopulate = function (next) {
  this.populate('instructors semester semesters')
  next()
}

// Bind the autoPopulate function to the courseModel's find and findOne methods
courseSchema.pre('find', autoPopulate)
courseSchema.pre('findOne', autoPopulate)

// Save a new course in the database. Data should be the course details from the Registrar
courseSchema.statics.createCourse = function (semester, department, data, callback) {
  var courseModel = mongoose.model('Course', courseSchema)

  // Process the instructors for this course
  var instructors = []
  for (var instructorIndex in data.instructors) {
    var thisInstructor = data.instructors[instructorIndex]
    instructors.push(thisInstructor.emplid)
    instructorModel.upsertInstructorWithCourse(thisInstructor.emplid, thisInstructor.first_name, thisInstructor.last_name, data.guid)
  }

  // Process the crosslistings for this course
  var crosslistings = []
  for (var crosslistingIndex in data.crosslistings) {
    var thisCrosslisting = data.crosslistings[crosslistingIndex]
    crosslistings.push({
      department: thisCrosslisting.subject,
      catalogNumber: thisCrosslisting.catalog_number
    })
  }

  courseModel.findOneAndUpdate({
    _id: data.guid
  }, {
    _id: data.guid,
    courseID: data.course_id,
    catalogNumber: data.catalog_number,
    title: data.title,
    semester: semester,
    department: department,
    description: data.detail.description,
    classes: data.classes,
    instructors: instructors,
    crosslistings: crosslistings,
    track: data.detail.track
  }, {
    new: true,
    upsert: true,
    runValidators: true,
    setDefaultsOnInsert: true
  }, function (error) {
    if (error) {
      console.log('Creating/updating a course failed. Error: %s', error)
    }
    if (typeof (callback) === 'function') {
      callback()
    }
  })
}

// Create the Course model from the courseSchema
var Course = mongoose.model('Course', courseSchema)

// Export the Course model
module.exports = Course
