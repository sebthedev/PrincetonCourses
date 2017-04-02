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

      display_titles(course);
      display_instructors(course);
      display_description(course);
      display_assignments(course);
      display_grading(course);
      display_prerequisites(course);
      display_equivalent(course);
      display_other(course);
      display_classes(course);


      var thisCourse = course



      //$('#fav-button')[0].course = thisCourse;
      //$('#comments').append(thisCourse.evaluations.studentComments)
      // stuff for course evaluations
      var evals = ""
      for (var field in thisCourse.evaluations[0].scores) {
        var val = thisCourse.evaluations[0].scores[field]
        evals += '<div>' + field + '</div>'
               + '<div class="progress"><div class="progress-bar" role="progressbar" '
               + 'style="width: ' + (val*20) + '%; background-color: ' + colorAt(val) + '"><strong>'
               + val.toFixed(2) + '</strong></div></div>' // as percentage of 5
      }
      if (evals == "") {
        $('#evals').append('No course evaluations available.')
      }
      else {
        $('#evals').append(evals)
      }

      // stuff for student comments
      var comments = ""
      for (var studentComment in thisCourse.evaluations[0].comments) {
          var val = thisCourse.evaluations[0].comments[studentComment].comment
          comments += '<li class="comments-list-comment">' + val + '</li>'
      }
      if (comments == "") {
        $('#comments').append('No student comments available.')
      }
      else {
        $('#comments').append(comments)
      }

      var dispbody = ''
      dispbody += '<h4 style= "font-weight:bold" id="disp-profs"></h4>'
                  + '<div id="instructor-info" style="display: none; background-color:#eeeeee;" class="col-sm-12 pre-scrollable flex-item"></div>'
                  + '<p>' + thisCourse.description + '</p>'
                  + (thisCourse.prerequisites == undefined ? '' :
                  '<h4 style="font-weight:bold">Prerequisites</h4><p>' + thisCourse.prerequisites + '</p>')
                  + (thisCourse.equivalentcourses == undefined ? '' :
                  '<h4 style="font-weight:bold">Equivalent Courses</h4><p>' + thisCourse.equivalentcourses + '</p>')
                  + (thisCourse.otherinformation == undefined ? '' :
                  '<h4 style="font-weight:bold">Other Information</h4><p>' + thisCourse.otherinformation + '</p>')
                  + (thisCourse.otherrequirements == undefined ? '' :
                  '<h4 style="font-weight:bold">Equivalent Courses</h4><p>' + thisCourse.otherrequirements + '</p>')
                  // '<h4 style="font-weight:bold">Classes</h4><p>' + thisCourse.classes[0] + '</p>'

      var openClasses = { table: '' };
      var closedClasses = { table: '' };
      var cancelledClasses = { table: '' };

      // Show classes of a course
      var makeClassTable = function(val, classes) {
        classes.table += '<tr class = "course-classes-tr">'
                  + '<td>' + val['section'] + '</td>'
                  + '<td>'
          for (var day in val.schedule.meetings[0].days) {
            //classes += thisCourse.classes.schedule.meetings[0].days[day]
            classes.table += val.schedule.meetings[0].days[day] + ' '
          }
          classes.table += '</td>'
          classes.table += (val.schedule.meetings[0] == undefined ? '' :
                    '<td>' + (val.schedule.meetings[0].start_time == undefined ? '' :
                      val.schedule.meetings[0].start_time) + ' - '
                    + (val.schedule.meetings[0].end_time == undefined ? '' :
                      val.schedule.meetings[0].end_time) + '</td>'
                    + '<td>' + (val.schedule.meetings[0].building == undefined ? '' :
                      val.schedule.meetings[0].building.short_name) + ' '
                    + (val.schedule.meetings[0].room == undefined ? '' :
                      val.schedule.meetings[0].room) + '</td>'
                  )
          classes.table += '<td>' + val['enrollment'] + ' / ' + val['capacity'] + '</td>'
                    + '</tr>'
      }

      for (var field in thisCourse.classes) {
        var val = thisCourse.classes[field]
        if (val['status'] == "Open") {
          makeClassTable(val, openClasses);
        }
        if (val['status'] == "Cancelled") {
          makeClassTable(val, cancelledClasses);
        }
        if (val['status'] == "Closed") {
          makeClassTable(val, closedClasses);
        }
      }
      dispbody += (openClasses.table == ''? '' :
                '<table id="class-table">' +
                '<th>Section</th><th>Days</th><th>Time</th><th>Room</th><th>Enrolled</th>' +
                '<h4 style="font-weight:bold">Open Classes</h4>' + openClasses.table + '</table>');
      dispbody += (closedClasses.table == ''? '' :
                '<table id="class-table">' +
                '<th>Section</th><th>Days</th><th>Time</th><th>Room</th><th>Enrolled</th>' +
                '<h4 style="font-weight:bold">Closed Classes</h4>' + closedClasses.table + '</table>');
      dispbody += (cancelledClasses.table == ''? '' :
                '<table id="class-table">' +
                '<th>Section</th><th>Days</th><th>Time</th><th>Room</th><th>Enrolled</th>' +
                '<h4 style="font-weight:bold">Cancelled Classes</h4>' + cancelledClasses.table + '</table>');
      $('#disp-body').append(dispbody)

      for (var instructor in thisCourse.instructors) {
        var name = '<a href="javascript:void(0)" class="course-prof" id = "'
                 + thisCourse.instructors[instructor]._id + '">'
                 + thisCourse.instructors[instructor].name['first'] + ' '
                 + thisCourse.instructors[instructor].name['last'] + '</a>'
          if ($('#disp-profs').html() !== '') {
            $('#disp-profs').append(', ')
          }
          $('#disp-profs').append(name)
      }

      var prevInstId = 0;
      $('.course-prof').on("click",function(){
        var instId =  $(this).attr("id");
        if (instId != prevInstId)
        {
          $('#instructor-info').hide();
          toggleInstructor(instId);
        }
        else
        {
          $('#instructor-info').slideToggle();
        }
        prevInstId = instId;
      })


  })
}

// display course data for title and subtitle
var display_titles = function(course) {
  // refresh
  $('#disp-title').html('')
  $('#disp-subtitle').html('')
  $('#disp-subtitle-right').html('')

  $('#disp-title').append(course.title)

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
    instructors += '<div>' + name + '</div>'
  }

  $('#disp-instructors-body').append(instructors)
}

// display description info
var display_description = function(course) {
  // refresh
  $('#disp-description-body').html('')

  $('#disp-description-body').append(course.description)
}

// display assignments info
var display_assignments = function(course) {
  // refresh
  $('#disp-assignments-body').html('')

  var assignments = ''
  for (var assignment in course.assignments) {
    var asmt = course.assignments[assignment]
    assignments += '<div>' + asmt + '</div>'
  }

  $('#disp-assignments-body').append(assignments)
}

// display grading info
var display_grading = function(course) {
  // refresh
  $('#disp-grading-body').html('')

  var grading = ''
  for (var index in course.grading) {
    var grade = course.grading[index]
    grading += '<div>' + grade.component + ': ' + grade.weight + '%</div>'
  }

  $('#disp-grading-body').append(grading)
}

// display prerequisites info
var display_prerequisites = function(course) {
  // refresh
  $('#disp-prerequisites-body').html('')

  var prerequisites = ''
  if (course.hasOwnProperty('prerequisites')) {
    prerequisites += course.prerequisites
  }

  $('#disp-prerequisites-body').append(prerequisites)
}

// display equivalent courses info
var display_equivalent = function(course) {
  // refresh
  $('#disp-equivalent-body').html('')

  var equivalent = ''
  if (course.hasOwnProperty('equivalentcourses')) {
    equivalent += course.equivalentcourses
  }

  $('#disp-equivalent-body').append(equivalent)
}

// display other info
var display_other = function(course) {
  // refresh
  $('#disp-other-body').html('')

  var other = ''
  if (course.hasOwnProperty('otherinformation')) {
    other += '<div>' + course.otherinformation + '</div>'
  }
  if (course.hasOwnProperty('otherrequirements')) {
    other += '<div>' + course.otherrequirements + '</div>'
  }

  $('#disp-other-body').append(other)
}

var display_classes = function(course) {

}
