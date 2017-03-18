// when document loads
$(document).ready(function () {

  // function for updating search results
  var getCourseData = function () {
    var query = {
      $text: {
        $search: $('#searchbox').val()
      },
      semester: $('#semester').val()
    }

    $.post('/api/courses',
    {
      query: JSON.stringify(query),
      sort: $('#sort').val()
    }, function (courses, status) {
      // Basic error handling
      if (status !== 'success') {
        window.alert('An error occured and your search could not be completed.')
      }

      // clear results
      $('#results').html('')
      $('#search-title').html('')

      /* SEB'S EXAMPLE

      // Insert the course results into the area
      for (var courseIndex in courses) {
        var thisCourse = courses[courseIndex]
        $('#results').append('<div class="course"><span style="font-weight:bold">' + thisCourse.department + ' ' + thisCourse.catalogNumber + '</span> ' + thisCourse.title + '</div>')
        $('#results').children().last()[0].course = thisCourse

      */

      $('#search-title').append(courses.length + ' Search Results')

      for (var courseIndex in courses) {
        var thisCourse = courses[courseIndex]

        // append result into results pane
        $('#results')[0].appendChild(newResultEntry(thisCourse))

        // attach object to DOM element
        $('#results').children().last()[0].course = thisCourse
      }
    })
  }

  // function for displaying course details
  var dispCourseData = function() {
    $(".search-result").removeClass("active");
    $(this).addClass("active")

    $('#disp-title').html('')
    $('#disp-subtitle').html('')
    $('#disp-profs').html('')
    $('#disp-body').html('')
    $('#evals').html('')
    $('#comments').html('')

    var thisCourse = this.course

    // string for course listings
    var listings =  getListings(thisCourse)

    $('#disp-title').append(thisCourse.title)

    $('#disp-subtitle').append(listings + ' '
                            + (thisCourse.distribution == undefined ? '' : ' <span class="label label-info">' + thisCourse.distribution + '</span>')
                            + (thisCourse.pdf["required"]  ? ' <span class="label label-warning">PDF ONLY</span>'
                            : (thisCourse.pdf["permitted"] ? ' <span class="label label-warning">PDF</span>'
                                                                   : ' <span class="label label-warning">NPDF</span>'))
                            + (thisCourse.audit ? ' <span class="label label-warning">AUDIT</span>' : ''))

    //$('#comments').append(thisCourse.evaluations.studentComments)

    // stuff for course evaluations
    var evals = ""
    for (var field in thisCourse.evaluations.scores) {
      var val = thisCourse.evaluations.scores[field]
      evals += '<div>' + field + '</div>'
             + '<div class="progress"><div class="progress-bar" role="progressbar" '
             + 'style="width: ' + (val*20) + '%; background-color: ' + colorAt(val) + '">'
             + val.toFixed(2) + '</div></div>' // as percentage of 5
    }
    if (evals == "") {
      $('#evals').append('No course evaluations available.')
    }
    else {
      $('#evals').append(evals)
    }

    // stuff for student comments
    var comments = ""
    for (var studentComment in thisCourse.evaluations.studentComments) {
        var val = thisCourse.evaluations.studentComments[studentComment]
        comments += '<li class="comments-list-comment">' + val + '</li>'
    }
    if (comments == "") {
      $('#comments').append('No student comments available.')
    }
    else {
      $('#comments').append(comments)
    }

    var dispbody = ''
    dispbody += '<h3 id="disp-profs"></h3>' +
                '<p>' + thisCourse.description + '</p>'
                + (thisCourse.prerequisites == undefined ? '' :
                '<h3>Prerequisites</h3><p>' + thisCourse.prerequisites + '</p>')
                + (thisCourse.equivalentcourses == undefined ? '' :
                '<h3>Equivalent Courses</h3><p>' + thisCourse.equivalentcourses + '</p>')
                + (thisCourse.otherinformation == undefined ? '' :
                '<h3>Other Information</h3><p>' + thisCourse.otherinformation + '</p>')
                + (thisCourse.otherrequirements == undefined ? '' :
                '<h3>Equivalent Courses</h3><p>' + thisCourse.otherrequirements + '</p>')
                + (thisCourse.website == undefined ? '' :
                '<h3>Website</h3><p><a href="' + thisCourse.website + '" target="_blank">' + thisCourse.website + '</a></p>')
    '<h3>Classes</h3><p>' + thisCourse.classes[0] + '</p>'

    var classes = ''
    for (var field in thisCourse.classes) {
      var val = thisCourse.classes[field]
      classes += '<tr class = "course-classes-tr">'
              + '<td>' + val['section'] + '</td>'
              + '<td>'
      for (var day in val.schedule.meetings[0].days) {
        //classes += thisCourse.classes.schedule.meetings[0].days[day]
        classes += val.schedule.meetings[0].days[day] + ' '
      }
      classes += '</td>'
      classes += (val.schedule.meetings[0] == undefined ? '' :
                '<td>' + (val.schedule.meetings[0].start_time == undefined ? '' :
                  val.schedule.meetings[0].start_time) + ' - '
                + (val.schedule.meetings[0].end_time == undefined ? '' :
                  val.schedule.meetings[0].end_time) + '</td>'
                + '<td>' + (val.schedule.meetings[0].building == undefined ? '' :
                  val.schedule.meetings[0].building.name) + ' '
                + (val.schedule.meetings[0].room == undefined ? '' :
                  val.schedule.meetings[0].room) + '</td>'
              )
      classes += '<td>' + val['enrollment'] + ' / ' + val['capacity'] + '</td>'
                + '<td>' + val['status'] + '</td>'
                + '</tr>'
    }
    dispbody += (classes == ''? '' :
                '<table id="class-table">' +
                '<th>Section</th><th>Days</th><th>Time</th><th>Room</th><th>Enrollment</th><th>Status</th>' +
                '<h3>Classes</h3>' + classes + '</table>')

    $('#disp-body').append(dispbody)

    for (var instructor in thisCourse.instructors) {
      var name = thisCourse.instructors[instructor].name['first'] + ' '
               + thisCourse.instructors[instructor].name['last']
        if ($('#disp-profs').html() !== '') {
          $('#disp-profs').append(', ')
        }
        $('#disp-profs').append(name)
    }
  }

  // Every time a key is pressed inside the #searchbox, call the getCourseData function
  $('#searchbox').keyup(getCourseData)
  $('#semester, #sort').change(getCourseData)

  // displays information in right pane on click of search result
  $('#results').on('click', 'a.search-result', dispCourseData)

  /* SEB' EXAMPLE

  // $('#results div').click(function () {
  //   console.log($(this).text())
  // })

  $('#results').on('click', 'div.course', function () {
    // window.alert('Handler for .click() called.')
    // console.log(this.course)
    window.alert('You just clicked on the course ' + this.course.title + '!')
  })

  */

  // feedback form toggling
  var toggleFeedback = function() {
   $('.feedback-form').slideToggle()
   if ($('#feedback-toggle').hasClass("active")) {
     $('#feedback-toggle').removeClass("active")
   } else {
     $('#feedback-toggle').addClass("active")
   }
 }

 $('#feedback-toggle').click(toggleFeedback)

  // load the semesters for the dropdown
  $.get('/api/semesters', function (semesters) {
    for (var semesterIndex in semesters) {
      var thisSemester = semesters[semesterIndex]
      $('#semester').append('<option value="' + thisSemester.code + '">' + thisSemester.name + '</select>')
    }
  })
})
