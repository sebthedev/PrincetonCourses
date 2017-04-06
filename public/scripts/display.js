// dependencies: module.js, fav.js, eval.js

// function for displaying course details for a result
// - icon is jQuery object of the corresponding li element
// - course is the corresponding course object
var displayResult = function(result, course) {
  // mark as active
  $('.search-result').removeClass('active')
  result.addClass('active')

  // Display the information for this course
  displayCourseDetails(course._id)
}

// function for displaying course details
var displayCourseDetails = function(courseID) {
  document.courseID = courseID
  // Push to the history this course
  window.history.pushState({courseID: courseID}, courseID, '/course/' + courseID + getSearchQueryURL())

  $.get('/api/course/' + courseID, function (course, status) {
      // Basic error handling
      if (status !== 'success') {
        window.alert('An error occured and your course could not be displayed.')
        return
      }

      document.course = course;

      display_title(course);
      display_subtitle(course);
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

// display course data for title TODO: favoriting
var display_title = function(course) {
  // refresh
  $('#disp-title').html('')
  $('#disp-title-right').html('')
  $('#disp-subtitle').html('')
  $('#disp-subtitle-right').html('')

  var website = (course.website === undefined ? '' : ' <a href="' + course.website
                                                   + '" target="_blank"><i class="fa fa-external-link-square"></i></a>')

  $('#disp-title').append(course.title + website)

  var isFav = (document.favorites.indexOf(course["_id"]) !== -1)

  // Determine the overall score for this course, if it exists
  var hasScore = (course.hasOwnProperty('evaluations') && course.evaluations.hasOwnProperty('scores') && course.evaluations.scores.hasOwnProperty('Overall Quality of the Course'))
  if (hasScore) {
    var score = course.evaluations.scores['Overall Quality of the Course']
  }

  var htmlString = '<i class="fa fa-heart ' + (isFav ? 'unfav-icon' : 'fav-icon') + '"></i> '
                 + '<span class="badge badge-large"' + (hasScore ? ' style="background-color: ' + colorAt(score) + '"' : '') + '>'
                   + (hasScore ? score.toFixed(2) : 'N/A')
                 + '</span>'

  $('#disp-title-right').append(htmlString)
  var icon = $('#disp-title-right').find('i')[0]
  $(icon).click(function() {            // enable click to fav/unfav
    toggleFav(course._id)
    isFav = $(this).hasClass('unfav-icon')
    $(this).removeClass(isFav ? 'unfav-icon' : 'fav-icon')
    $(this).addClass(isFav ? 'fav-icon' : 'unfav-icon')
  })
}

// display course data for subtitle
var display_subtitle = function(course) {
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

  var semester = ' &middot; ' + course.semester.name

  // link to registrar
  var link = ' <a href="https://registrar.princeton.edu/course-offerings/course_details.xml'
           + '?courseid=' + course.courseID
           + '&amp;term=' + course.semester._id
           + '" target="_blank"><i class="fa fa-external-link"></i></a>'

  $('#disp-subtitle-right').append(link + semester)
}

// display instructor info
var display_instructors = function(course) {
  // refresh
  $('#disp-instructors-body').html('')

  var instructors = ''
  for (var instructor in course.instructors) {
    var name = course.instructors[instructor].name.first
             + ' ' + course.instructors[instructor].name.last
    instructors += (
      '<li class="list-group-item">'
      + '<div class="flex-container-row">'
        + '<div class="flex-item-stretch truncate">'
          + '<strong>' + name + '</strong>'
        + '</div>'
        + '<div class="flex-item-rigid">'
          + '(' + course.instructors[instructor].courses.length + ')'
        + '</div>'
      + '</div>'
    + '</li>'
    )
  }

  $('#disp-instructors-body').append(instructors)
  display_autotoggle('instructors')
}

// display description info
var display_description = function(course) {
  // refresh
  $('#disp-description-body').html('')

  $('#disp-description-body').append('<li class="list-group-item">' + course.description + '</li>')
  display_autotoggle('description')
}

// display assignments info
var display_assignments = function(course) {
  // refresh
  $('#disp-assignments-body').html('')

  var assignments = ''
  for (var assignment in course.assignments) {
    var asmt = course.assignments[assignment]
    assignments += '<li class="list-group-item">' + asmt + '</li>'
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
    grading += '<li class="list-group-item">' + grade.component + ': ' + grade.weight + '%</li>'
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
    prerequisites += '<li class="list-group-item">' + course.prerequisites + '</li>'
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
    equivalent += '<li class="list-group-item">' + course.equivalentcourses + '</li>'
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
    other += '<li class="list-group-item">' + course.otherinformation + '</li>'
  }
  if (course.hasOwnProperty('otherrequirements')) {
    other += '<li class="list-group-item">' + course.otherrequirements + '</li>'
  }

  $('#disp-other-body').append(other)
  display_autotoggle('other')
}

// display class info
var display_classes = function(course) {
  // refresh
  $('#disp-classes-body').html('')

  for (var index in course.classes) {
    var aclass = course.classes[index]
    $('#disp-classes-body').append(newDOMclassListing(aclass))
  }

  display_autotoggle('classes')
}

// returns a DOM object for a class of the displayed course
var newDOMclassListing = function(aclass) {
  var name = aclass.section
  var status = aclass.status
  var filled = aclass.enrollment + ' / ' + aclass.capacity
  var code = aclass.class_number
  var statusColor = ''
  if (status === 'Open') statusColor = ' class="text-success-dim"'
  else if (status === 'Closed') statusColor = ' class="text-warning-dim"'
  else if (status === 'Cancelled') statusColor = ' class="text-danger-dim"'

  // a row for each meeting
  var meetingString = ''
  for (var index in aclass.schedule.meetings) {
    var meeting = aclass.schedule.meetings[index]

    var hasBuilding = (meeting.hasOwnProperty('building') &&
                       meeting.building.hasOwnProperty('short_name'))
    var hasRoom = meeting.hasOwnProperty('room')

    var room = ((hasBuilding ? (meeting.building.short_name + ' ') : '')
               + (hasRoom ? meeting.room : ''))

    var time = ''
    for (var day in meeting.days) time += meeting.days[day] + ' '
    time += meeting.start_time + ' - ' + meeting.end_time

    meetingString += (
      '<div class="flex-container-row">'
      + '<div class="flex-item-stretch truncate">' + time + '</div>'
      + '<div class="flex-item-rigid">' + room + '</div>'
    + '</div>'
    )
  }

  // html string
  var htmlString = (
    '<li class="list-group-item">'
    + '<div class="flex-container-row">'
      + '<div class="flex-item-stretch truncate">'
        + '<strong>' + name + '\xa0<small' + statusColor + '>' + status + '</small></strong>'
      + '</div>'
      + '<div class="flex-item-rigid"><strong>' + filled + '</strong></div>'
    + '</div>'
    + meetingString
  + '</li>'
  )

  var entry = $.parseHTML(htmlString)[0] // create DOM object

  return entry
}
