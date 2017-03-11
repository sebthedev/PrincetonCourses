// This script is a model of the Course object

// Load external dependencies
var mongoose = require('mongoose')
var instructorModel = require('./instructor.js')

// Define the courseSchema
var courseSchema = new mongoose.Schema({
  _id: Number,
  courseID: String,
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
  evaluations: {
    scores: {},
    studentComments: [{
      type: String,
      trim: true
    }]
  },
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
  }
})

// Create the virtual commonName property
courseSchema.virtual('commonName').get(function () {
  return this.department + ' ' + this.catalogNumber
})

// Create an index on this schema which allows for awesome weighted text searching
courseSchema.index({
  title: 'text',
  description: 'text',
  department: 'text',
  catalogNumber: 'text'
}, {
  'weights': {
    title: 10,
    description: 1,
    department: 20,
    catalogNumber: 10
  },
  name: 'PublicCourseSearch'
})

// Automatically populate instructors and semester
var autoPopulate = function (next) {
  this.populate('instructors semester')
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
    crosslistings: crosslistings
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
