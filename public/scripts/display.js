// dependencies: module.js, fav.js, eval.js

// function for displaying course details for a result
var displayResult = function() {
  // Push to the history this course
  var courseID = this.course._id
  window.history.pushState({courseID: courseID}, courseID, '/course/' + courseID)

  // Display the information for this course
  displayCourseDetails(courseID)
}

// function for displaying course details
var displayCourseDetails = function(courseID) {
  $.get('/api/course/' + courseID, function (course, status) {
      // Basic error handling
      if (status !== 'success') {
        window.alert('An error occured and your course could not be displayed.')
        return
      }

      document.course = course;

      display_titles(course);
      display_instructors(course);
      display_description(course);
      display_assignments(course);
      display_grading(course);
      display_prerequisites(course);
      display_equivalent(course);
      display_other(course);
      display_classes(course);
      display_evals(course); // in eval.js
  })
}

// shows/hides sections of no content
var display_autotoggle = function(section) {
  var div = $('#disp-' + section)
  var body = $('#disp-' + section + '-body')
  var isEmpty = body.is(':empty')

  div.css('display', isEmpty ? 'none' : '')
}

// display course data for title and subtitle. TODO: favoriting
var display_titles = function(course) {
  // refresh
  $('#disp-title').html('')
  $('#disp-title-right').html('')
  $('#disp-subtitle').html('')
  $('#disp-subtitle-right').html('')

  var website = (course.website === undefined ? '' : ' <a href="' + course.website
                                                   + '" target="_blank"><i class="fa fa-external-link-square"></i></a>')

  $('#disp-title').append(course.title + website)

  var isFav = (document.favorites.indexOf(course["_id"]) !== -1)

  var hasScore = false;
  for (var index in course.evaluations) {
    var eval = course.evaluations[index]
    if (eval.semester._id === course.semester._id) {
      if (eval.hasOwnProperty('scores') && eval.scores.hasOwnProperty('Overall Quality of the Course')) {
        var score = eval.scores['Overall Quality of the Course']
        hasScore = true;
      }
    }
  }

  var htmlString = '<i class="fa fa-heart ' /*+ (isFav ? 'unfav-icon' : 'fav-icon')*/ + '"></i> '
                 + '<span class="badge badge-large"' + (hasScore ? ' style="background-color: ' + colorAt(score) + '"' : '') + '>'
                   + (hasScore ? score.toFixed(2) : 'N/A')
                 + '</span>'

  $('#disp-title-right').append(htmlString)
  $('#disp-title-right').find('i')[0].courseId = course["_id"]   // link to course id for fav icon
  //$('#disp-title-right').find('i').click(function() {toggleFav(course)})              // enable click to fav/unfav

  // string for course listings
  var listings = mainListing(course) + crossListings(course)

  // tags
  var tags = ''
  if (course.distribution !== undefined) tags += ' <span class="label label-info">' + course.distribution + '</span>'
  if (course.pdf["required"])            tags += ' <span class="label label-danger">PDF ONLY</span>'
  else if (course.pdf["permitted"])      tags += ' <span class="label label-warning">PDF</span>'
  else                                   tags += ' <span class="label label-danger">NPDF</span>'
  if (course.audit)                      tags += ' <span class="label label-warning">AUDIT</span>'

  $('#disp-subtitle').append(listings + tags)

  // link to registrar
  var link = '<a href="https://registrar.princeton.edu/course-offerings/course_details.xml'
           + '?courseid=' + course.courseID
           + '&amp;term=' + course.semester._id
           + '" target="_blank"><i class="fa fa-external-link"></i></a>'

  $('#disp-subtitle-right').append(link)
}

// display instructor info
var display_instructors = function(course) {
  // refresh
  $('#disp-instructors-body').html('')

  var instructors = ''
  for (var instructor in course.instructors) {
    var name = course.instructors[instructor].name.first
             + ' ' + course.instructors[instructor].name.last
    instructors += '<div class="list-group-item">' + name + '</div>'
  }

  $('#disp-instructors-body').append(instructors)
  display_autotoggle('instructors')
}

// display description info
var display_description = function(course) {
  // refresh
  $('#disp-description-body').html('')

  $('#disp-description-body').append('<div class="list-group-item">' + course.description + '</div>')
  display_autotoggle('description')
}

// display assignments info
var display_assignments = function(course) {
  // refresh
  $('#disp-assignments-body').html('')

  var assignments = ''
  for (var assignment in course.assignments) {
    var asmt = course.assignments[assignment]
    assignments += '<div class="list-group-item">' + asmt + '</div>'
  }

  $('#disp-assignments-body').append(assignments)
  display_autotoggle('assignments')
}

// display grading info
var display_grading = function(course) {
  // refresh
  $('#disp-grading-body').html('')

  var grading = ''
  for (var index in course.grading) {
    var grade = course.grading[index]
    grading += '<div class="list-group-item">' + grade.component + ': ' + grade.weight + '%</div>'
  }

  $('#disp-grading-body').append(grading)
  display_autotoggle('grading')
}

// display prerequisites info
var display_prerequisites = function(course) {
  // refresh
  $('#disp-prerequisites-body').html('')

  var prerequisites = ''
  if (course.hasOwnProperty('prerequisites')) {
    prerequisites += '<div class="list-group-item">' + course.prerequisites + '</div'
  }

  $('#disp-prerequisites-body').append(prerequisites)
  display_autotoggle('prerequisites')
}

// display equivalent courses info
var display_equivalent = function(course) {
  // refresh
  $('#disp-equivalent-body').html('')

  var equivalent = ''
  if (course.hasOwnProperty('equivalentcourses')) {
    equivalent += '<div class="list-group-item">' + course.equivalentcourses + '</div>'
  }

  $('#disp-equivalent-body').append(equivalent)
  display_autotoggle('equivalent')
}

// display other info
var display_other = function(course) {
  // refresh
  $('#disp-other-body').html('')

  var other = ''
  if (course.hasOwnProperty('otherinformation')) {
    other += '<div class="list-group-item">' + course.otherinformation + '</div>'
  }
  if (course.hasOwnProperty('otherrequirements')) {
    other += '<div class="list-group-item">' + course.otherrequirements + '</div>'
  }

  $('#disp-other-body').append(other)
  display_autotoggle('other')
}

var display_classes = function(course) {
  display_autotoggle('classes')
}
