// dependencies: fav.js, eval.js, layout.js, history.js, suggest.js, icon.js

// function for displaying course details for a result
// - course is the corresponding course object
var displayResult = function() {
  var courseId = this.courseId
  var instructorId = this.instructorId

  history_display(courseId)

  // Display the information for this course
  displayCourseDetails(courseId, false, instructorId)

  return false
}

// function for displaying course details
// -- noswipe to prevent swiping if on mobile
var displayCourseDetails = function(courseId, noswipe, instructorId) {
  // return to default view if undefined
  if (courseId === '') {
    document.courseId = undefined;
    document.course = undefined;
    layout_initial_show()

    displayActive() // update highlighting of active course
    $('#display-pane').stop().css('opacity', '')
    return;
  }

  $('#display-pane').stop().animate({'opacity': '0.5'})

  $.get('/api/course/' + courseId, function (course, status) {
      // Basic error handling
      if (status !== 'success') {
        window.alert('An error occured and your course could not be displayed.')
        return
      }

      document.courseId = courseId
      document.course = course;

      display_title(course);
      display_subtitle(course);
      display_instructors(course, instructorId);
      display_description(course);
      display_readings(course);
      display_assignments(course);
      display_grading(course);
      display_prerequisites(course);
      display_equivalent(course);
      display_other(course);
      display_reserved(course);
      display_classes(course);
      display_evals(course); // in eval.js
      display_past(course);

      // Make a no-cache request for the class enrollment information
      var cachebust = Math.random().toString().split('.')[1];
      $.get('/api/course/' + courseId + '/classes' + '?cachebust=' + cachebust, function (classes, status) {
        display_classes({classes: classes});
      })

      displayActive() // update highlighting of active course

      // set scroll to top
      $('#evals-pane').scrollTop(0)
      $('#info-pane').scrollTop(0)

      // make sure it can be seen
      layout_initial_hide()

      // go to display pane for mobile
      if (document.isMobile && $('#main-pane').slick('slickCurrentSlide') !== 2 && noswipe !== true) {
        $('#main-pane').slick('slickGoTo', 2)
        /* $('#display-body').slick('slickGoTo', 1) */
      }
      $('#display-pane').stop().css('opacity', '')
  })
}

// mark all corresponding courses as active
var displayActive = function() {
  $(".search-result").each(function() {
    var isActive = (this.courseId === document.courseId)

    var result = $(this)
    if (isActive) result.addClass('active')
    else result.removeClass('active')
  })
}

// shows/hides sections of no content
var display_autotoggle = function(section) {
  var $div = $('#disp-' + section)
  var $body = $('#disp-' + section + '-body')
  var isEmpty = $body.is(':empty')

  if (isEmpty) $div.hide()
  else $div.show()
}

// display course data for title TODO: favoriting
var display_title = function(course) {
  // refresh
  $('#disp-title').html('')
  $('#disp-title-right').html('')
  $('#disp-subtitle').html('')
  $('#disp-subtitle-right').html('')

  $('#disp-title').append(course.title)

  var favCount = (
    '<strong '
    + 'data-toggle="tooltip" '
    + 'data-original-title="' + course.favoritesCount + ' users have favorited this course" '
    + 'data-placement="bottom" '
  + '>'
      + course.favoritesCount
  + '</strong>'
  )

  var htmlString = (
    '&nbsp;'
  + newHTMLfavIcon(course._id, {'title': 1})
  + '<sub>'
    + favCount
  + '</sub> '
  + newHTMLscoreBadge(course, {'title': 1})
  )

  $('#disp-title-right').append(htmlString)
  var icon = $('#disp-title-right').find('i.fa-heart')[0]
  icon.courseId = course._id  // bind course id
  $(icon).click(toggleFav)    // enable click to fav/unfav
}

// display course data for subtitle
var display_subtitle = function(course) {
  // string for course listings
  var listings = newHTMLlistings(course, {'title': 1})

  // tags
  var tags = newHTMLtags(course, {'title': 1})

  var website =
      course.website === undefined
          ? ""
          : '<a href="' +
            course.website +
            '" target="_blank" style="text-decoration: none;">' +
            '<span title="View course website" class="label label-primary">Course Site' +
            '<i class="fa fa-external-link" style="margin-left: 5px;"></i></span></a>';

  $('#disp-subtitle').append(listings + ' ' + tags + ' ' + website)

  var semester = course.semester.name;

  // link to registrar
  var link =
      '<a href="https://registrar.princeton.edu/course-offerings/course_details.xml' +
      "?courseid=" +
      course.courseID +
      "&amp;term=" +
      course.semester._id +
      '" target="_blank" style="text-decoration: none;">' +
      '<span title="View course in Course Offerings" class="label label-primary">Registrar' +
      '<i class="fa fa-external-link" style="margin-left: 5px;"></i>' +
      "</span></a>" +
      " ";
  var snatch_link =
      '<a href="https://snatch.tigerapps.org/course' +
      "?courseid=" +
      course.courseID +
      '&skip" target="_blank" style="text-decoration: none;">' +
      '<span title="View course in TigerSnatch" class="label label-warning">Snatch' +
      '<i class="fa fa-external-link" style="margin-left: 5px;"></i>' +
      "</span></a>" +
      " ";
  $('#disp-subtitle-right').append(snatch_link + link + semester)
}

// display instructor info
var display_instructors = function(course, instructorId) {
  // refresh
  $('#disp-instructors-body').html('')

  var instructors = ''
  for (var index in course.instructors) {
    var instructor = course.instructors[index]
    $('#disp-instructors-body').append(newDOMinstructorResult(instructor, {'instructorId': instructorId, 'opens': 1}))
  }

  display_autotoggle('instructors')
}

// display description info
var display_description = function(course) {
  // refresh
  $('#disp-description-body').html('')

  $('#disp-description-body').append('<li class="list-group-item info-list-item">' + course.description + '</li>')
  display_autotoggle('description')
}

var display_readings = function(course) {
  // refresh
  $('#disp-readings-body').html('')

  for (var index in course.readings) {
    var reading = course.readings[index]
    $('#disp-readings-body').append(newDOMreadingListing(reading))
  }

  display_autotoggle('readings')
}

// returns a DOM object for a reading of the displayed course
var newDOMreadingListing = function(reading) {
  var author = reading.author || ''
  var title = reading.title || ''

  var librarySearchURL = 'https://pulsearch.princeton.edu/catalog?f1=title&op1=OR&q1=' + encodeURIComponent(title) + '&f2=author&op2=OR&q2=' + encodeURIComponent(author) + '&search_field=advanced&commit=Search'

  // html string
  var htmlString = (
    '<li class="list-group-item info-list-item search-result" data-toggle="tooltip" data-original-title="Click to search the library for this reading">'
    + '<a href="' + librarySearchURL + '" target="_blank" style="color: #333; text-decoration: none;">'
      + '<div class="flex-container-row">'
        + '<div class="flex-item-stretch truncate"><strong>' + author + '</strong></div>'
      + '</div>'
      + '<div class="flex-container-row">'
        + '<div class="flex-item-stretch truncate">' + title + '</div>'
      + '</div>'
    + '</a>'
  + '</li>'
  )

  var entry = $.parseHTML(htmlString)[0] // create DOM object

  return entry
}

// display assignments info
var display_assignments = function(course) {
  // refresh
  $('#disp-assignments-body').html('')

  var assignments = ''
  for (var index in course.assignments) {
    var assignment = course.assignments[index]
    assignments += '<div>' + assignment + '</div>'
  }
  if (assignments !== '') assignments = '<li class="list-group-item info-list-item">' + assignments + '</li>'

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
    grading += '<div>' + grade.weight + '% ' + grade.component + '</div>'
  }
  if (grading !== '') grading = '<li class="list-group-item info-list-item">' + grading + '</li>'

  $('#disp-grading-body').append(grading)
  display_autotoggle('grading')
}

// display prerequisites info
var display_prerequisites = function(course) {
  // refresh
  $('#disp-prerequisites-body').html('')

  var prerequisites = ''
  if (course.hasOwnProperty('prerequisites')) {
    prerequisites += '<li class="list-group-item info-list-item">' + course.prerequisites + '</li>'
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
    equivalent += '<li class="list-group-item info-list-item">' + course.equivalentcourses + '</li>'
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
    other += '<li class="list-group-item info-list-item">' + course.otherinformation + '</li>'
  }
  if (course.hasOwnProperty('otherrequirements')) {
    other += '<li class="list-group-item info-list-item">' + course.otherrequirements + '</li>'
  }

  $('#disp-other-body').append(other)
  display_autotoggle('other')
}

// display reserved seat info
var display_reserved = function(course) {
  // refresh
  $('#disp-reserved-body').html('')

  var reserved = ''
  for (var index in course.reservedSeats) {
    var seat = course.reservedSeats[index]
    reserved += '<div>' + seat + '</div>'
  }
  if (reserved !== '') reserved = '<li class="list-group-item info-list-item">' + reserved + '</li>'

  $('#disp-reserved-body').append(reserved)
  display_autotoggle('reserved')
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
  var status = aclass.status
  var filled = aclass.enrollment + ' / ' + aclass.capacity
  var code = aclass.class_number
  var statusColor = ''
  if (status === 'Open') statusColor = ' class="text-success"'
  else if (status === 'Closed') statusColor = ' class="text-warning"'
  else if (status === 'Cancelled') statusColor = ' class="text-danger"'

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

  var name = '<span data-toggle="tooltip" data-original-title="' + aclass.type_name + '">' + aclass.section + '</span>'

  // html string
  var htmlString = (
    '<li class="list-group-item info-list-item">'
    + '<div class="flex-container-row">'
      + '<div class="flex-item-stretch truncate">'
        + '<strong>' + name + '</strong>'
        + ' <small' + statusColor + '>' + status + '</small>'
        + ' <small class="class-code text-muted" data-toggle="tooltip" data-original-title="Class number">#' + aclass.class_number + '</small>'
      + '</div>'
      + '<div class="flex-item-rigid"><strong>' + filled + '</strong></div>'
    + '</div>'
    + meetingString
  + '</li>'
  )

  var entry = $.parseHTML(htmlString)[0] // create DOM object

  return entry
}

// displaying indicators of evals from past semesters
var display_past = function(course) {
  var isPast = course.hasOwnProperty('scoresFromPreviousSemester') && course.scoresFromPreviousSemester

  // Display the name of the semester for which evaluations are being displayed
  if (isPast && course.hasOwnProperty('evaluations') && course.evaluations.hasOwnProperty('semester') &&
  course.evaluations.semester.hasOwnProperty('name')) {
    $('.evals-past .evals-past-semester').text(course.evaluations.semester.name)
  } else {
    $('.evals-past .evals-past-semester').text('a different semester')
  }
  $('.evals-past').toggle(isPast)
}
