// This script is a model of the Course object

// Load external dependencies
var mongoose = require('mongoose')
var instructorModel = require('./instructor.js')

// Define the courseSchema
var courseSchema = new mongoose.Schema({
  _id: Number,
  courseID: Number,
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
  }]
})

// Create the virtual commonName property
courseSchema.virtual('commonName').get(function () {
  return this.department + ' ' + this.catalogNumber
})

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

courseSchema.statics.findCourse = function (department, catalogNumber, callback) {
  var Course = mongoose.model('Course', courseSchema)
  Course.findOne({
    department: department,
    catalogNumber: catalogNumber
  }).populate('semester instructors')
    .exec(function (error, thisCourse) {
      if (error) {
        console.log('Error on finding a course.')
      } else {
        if (thisCourse == null) {
          console.log('No such course could be found.')
        } else {
          console.log('Found the course!')
          callback(thisCourse)
        }
      };
    })
}

// Create the Course model from the courseSchema
var Course = mongoose.model('Course', courseSchema)

// Export the Course model
module.exports = Course
