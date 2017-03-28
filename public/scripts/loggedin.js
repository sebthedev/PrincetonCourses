// when document loads
$(document).ready(function () {

  // construct local favorites list
  document.favorites = []
  $.get('/api/user/favorites', function(courses) {
    for (var course in courses) {
      document.favorites.push(courses[course]["_id"])
    }
  })

  // get User
  var thisUser = this.User
  $.get('/api/whoami', function (data) {
    $('#nav-netid').html('')
    $('#nav-netid').append(data['netid'])
  })

  // initial displaying favorites
  var dispFavorites = function() {

    // call api to get favorites and display
    $.get('/api/user/favorites', function(courses) {

      $('#favorite-header').css('display', (courses == undefined || courses.length == 0) ? 'none' : '')

      $('#favs').html('');
      $('#favorite-title').html('');

      $('#favorite-title').append(courses.length + ' Favorite Course' + (courses.length !== 1 ? 's' : ''))
      for (var courseIndex in courses) {
        var thisCourse = courses[courseIndex];

        // append favorite into favs pane
        $('#favs').append(newDOMResult(thisCourse, {"semester": 1, "tags": 1}));
      }
    })
  }

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

      $('#search-title').append(courses.length + ' Search Result' + (courses.length !== 1 ? 's' : ''))

      for (var courseIndex in courses) {
        var thisCourse = courses[courseIndex]
        $('#results').append(newDOMResult(thisCourse, {"tags": 1}))
      }
    })
  }

  // function for displaying course details
  var dispCourseData = function() {
    $(".search-result").removeClass("active");
    $("#welcome-display-pane").css("display", "none");
    $("#display-pane").css("display", "");
    //document.getElementById("display-pane").style.display = "inline";
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
                            + (thisCourse.pdf["required"]  ? ' <span class="label label-danger">PDF ONLY</span>'
                            : (thisCourse.pdf["permitted"] ? ' <span class="label label-warning">PDF</span>'
                                                                   : ' <span class="label label-danger">NPDF</span>'))
                            + (thisCourse.audit ? ' <span class="label label-warning">AUDIT</span>' : '')
                            /*+ ' <span type="button" class="btn-primary btn-default btn-sm" id="fav-button" style="font-weight:bold">Favorite</span>'*/
                            + (thisCourse.website == undefined ? '' : ' <a href="' + thisCourse.website
                                                                      + '" target="_blank"><i class="fa fa-link"></i></a>')
                            + ' <a href="https://registrar.princeton.edu/course-offerings/course_details.xml?courseid=' + thisCourse["courseID"]
                                      + '&term=' + thisCourse["semester"]["code"] + '" target="_blank"><i class="fa fa-external-link"></i></a>')

    //$('#fav-button')[0].course = thisCourse;
    //$('#comments').append(thisCourse.evaluations.studentComments)
    // stuff for course evaluations
    var evals = ""
    for (var field in thisCourse.evaluations.scores) {
      var val = thisCourse.evaluations.scores[field]
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

    // favorite a course
    $("#fav-button").click(function() {
      var thisCourseId = this.course["_id"];
      if (thisUser.favoriteCourses.includes(thisCourseId))
      {
        $.ajax({
          url: '/api/user/favorite',
          type: 'PUT',
          data: {'course': thisCourseId},
          success: function() {dispFavorites();}
        });
      }
      else {
        $.ajax({
          url: '/api/user/favorite',
          type: 'DELETE',
          data: {'course': thisCourseId},
          success: function() {dispFavorites();}
        });
      }
    })

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

    // Instructor page toggling
    var toggleInstructor = function(instId) {
      $('#instructor-info').html('');
      var instInfo = '';

      $.get('/api/instructor/' + instId, function (data) {
        var thisInst = data;
        instInfo += '<p> Courses taught by <strong>' + thisInst.name['first'] + ' ' + thisInst.name['last'] + '</strong></p>';
        instInfo += '<ul id="prof-courses">'
        $('#instructor-info').append(instInfo);
        for (var courseIndex in thisInst.courses) {
          var thisCourse = thisInst.courses[courseIndex];
          var entry = newDOMResult(thisCourse, {"semester": 1, "tags": 1})
          $('#prof-courses').append(entry);
        }
        /*for (course in thisInst.courses)
        {
          var courseId = thisInst.courses[course];
          instInfo += '<li id="prof-course"><div>' + courseId["title"] + '</div></li>';
        }*/
        $('#instructor-info').slideToggle();
      })
    }
  }

  // Every time a key is pressed inside the #searchbox, call the getCourseData function
  $('#searchbox').keyup(getCourseData)
  $('#semester, #sort').change(getCourseData)

  // displays information in right pane on click of search result
  $('#results').on('click', 'li.search-result', dispCourseData)
  $('#favs').on('click', 'li.search-result', dispCourseData)
  //$('#disp-profs').on('click', 'a.course-prof', toggleInstructor)

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
    $('#feedback-form').slideToggle()
    if ($('#feedback-toggle').hasClass("active")) {
      $('#feedback-toggle').removeClass("active")
    } else {
      $('#feedback-toggle').addClass("active")
    }
  }


  $('#feedback-toggle').click(toggleFeedback)

  // toggle display of favorite things
  var toggleFavDisplay = function() {
    var isVisible = $('#favorite-courses').css('display') !== 'none'

    var icon = $('#fav-display-toggle')
    icon.removeClass(isVisible ? 'fa-minus' : 'fa-plus')
    icon.addClass(isVisible ? 'fa-plus' : 'fa-minus')
    $('#favorite-courses').slideToggle()
  }
  $('#fav-display-toggle').click(toggleFavDisplay)
  $('#favorite-courses').css('max-height', '30%')

  // toggle display of search result things
  var toggleSearchDisplay = function() {
    var isVisible = $('#search-results').css('display') !== 'none'

    var icon = $('#search-display-toggle')
    icon.removeClass(isVisible ? 'fa-minus' : 'fa-plus')
    icon.addClass(isVisible ? 'fa-plus' : 'fa-minus')
    $('#favorite-courses').animate({'max-height': (isVisible ? '100%' : '30%')})

    $('#search-results').slideToggle()
  }
  $('#search-display-toggle').click(toggleSearchDisplay)


  // load the semesters for the dropdown
  $.get('/api/semesters', function (semesters) {
    for (var semesterIndex in semesters) {
      var thisSemester = semesters[semesterIndex]
      $('#semester').append('<option value="' + thisSemester.code + '">' + thisSemester.name + '</select>')
    }
  })

  for (var i = 1.0; i < 5.05; i += 0.1) {
    $('#disp-body').append('<span class="badge" style="background-color: '
      + colorAt(i) + '">'
      + i.toFixed(2)
      + '</span>')
  }
  $('#disp-body').append('<span class="badge"> N/A </span>')

  dispFavorites();
})
