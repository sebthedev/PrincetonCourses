// when document loads
$(document).ready(function () {

  //var winWidth = $(window).height(); 
  var winWidth = $(window).width(); 

  var onresize = function() {
    //your code here
    //this is just an example
    winWidth = document.body.clientWidth;
    winHeight = document.body.clientHeight;
    if (winWidth > 770)
    {
      //var backButton = '<div><button type="button" onclick="goBackToSearchResults();" class="btn btn-secondary">Back</div></span>'
      $('#search-pane').css("display", "");
      $('#display-pane').css("display", "");
      $('body').css("background-color", "#ffffff");
      $('#backButton').css("display", "none");
    }
    if (winWidth < 770)
    {
      //var backButton = '<div><button type="button" onclick="goBackToSearchResults();" class="btn btn-secondary">Back</div></span>'
      $('#search-pane').css("display", "");
      $('#display-pane').css("display", "none");
      $('body').css("background-color", "#dddddd");
    }
  }
  window.addEventListener("resize", onresize);

  // construct local favorites list
  $.get('/api/user/favorites', function(courses) {
    document.favorites = []
    for (var course in courses) {
      document.favorites.push(courses[course]["_id"])
    }
  })

  // update favoriting in search results for course with courseId
  var searchFav = function(courseId) {
    $("#results").children().each(function(index) {
      if (this.course["_id"] !== courseId) {
        return
      }

      var icon = $(this).find("i")
      icon.removeClass('fav-icon')
      icon.addClass('unfav-icon')
      icon.off('click')
      icon.click(clickToUnFav)
    })
  }

  // update unfavoriting in search results for course with courseId
  var searchUnFav = function(courseId) {
    $("#results").children().each(function(index) {
      if (this.course["_id"] !== courseId) {
        return
      }

      var icon = $(this).find("i")
      icon.removeClass('unfav-icon')
      icon.addClass('fav-icon')
      icon.off('click')
      icon.click(clickToFav)
    })
  }

  // update favoriting in favorite list for course
  var favFav = function(course) {
    if (document.favorites.length === 1) {
      $('#favorite-title').slideToggle()
    }

    var entry = $.parseHTML(newFavEntry(course))[0]

    entry.course = course
    $(entry).find(".unfav-icon")[0].courseId = course["_id"]
    $(entry).find(".unfav-icon").click(clickToUnFav)
    entry.setAttribute('style', 'display: none;')

    $('#favorite-title').html('')
    $('#favorite-title').append(document.favorites.length + ' Favorite Courses')
    $('#favs').append(entry)
    $(entry).slideToggle()
  }

  // update unfavoriting in favorite list for courseId
  var favUnFav = function(courseId) {
    $("#favs").children().each(function(index) {
      if (this.course["_id"] !== courseId) {
        return
      }

      $('#favorite-title').html('')
      $('#favorite-title').append(document.favorites.length + ' Favorite Courses')

      if (document.favorites.length === 0) {
        $('#favorite-title').slideToggle()
      }
      $(this).slideToggle(function() {
        this.remove()
      })
    })
  }

  // handle a click to favorite a course
  var clickToFav = function() {
    var thisCourseId = this.courseId;

    // something is broken if the course is already favorited
    var i = document.favorites.indexOf(thisCourseId)
    if (i !== -1) {
      return;
    }

    var course = $(this).parents("li.search-result")[0].course

    // save to local list
    document.favorites.push(thisCourseId)

    searchFav(thisCourseId)
    favFav(course)

    // update database
    $.ajax({
      url: '/api/user/favorite',
      type: 'PUT',
      data: {'course': thisCourseId},
      success: function() {
      }
    });

    return false;
  }

  // handle a click to unfavorite a course
  var clickToUnFav = function() {
    var thisCourseId = this.courseId;

    // something is broken if the course is not favorited
    var i = document.favorites.indexOf(thisCourseId)
    if (i === -1) {
      return;
    }

    // remove from local list
    document.favorites.splice(i, 1)

    searchUnFav(thisCourseId)
    favUnFav(thisCourseId)

    // update database
    $.ajax({
      url: '/api/user/favorite',
      type: 'DELETE',
      data: {'course': thisCourseId},
      success: function() {
      }
    });

    return false;
  }

  // get User
  var thisUser = this.User
  $.get('/api/whoami', function (data) {
    thisUser = data;
    if (typeof(thisUser.favoriteCourses) != 'undefined')
    {
      getFavorites();
    }
  })

  // initial displaying favorites
  var dispFavorites = function() {

    // call api to get favorites and display
    $.get('/api/user/favorites', function(courses) {

      if (courses == undefined)
      {
        document.getElementById("favorite-title").style.display = "none";
      }
      else {
        if (courses.length == 0)
        {
          document.getElementById("favorite-title").style.display = "none";
        }
        else
        {
          document.getElementById("favorite-title").style.display = "block";
        }

      }

      $('#favs').html('');
      $('#favorite-title').html('');

      $('#favorite-title').append(courses.length + ' Favorite Courses')
      for (var courseIndex in courses) {
        var thisCourse = courses[courseIndex];

        // append favorite into favs pane
        $('#favs').append(newFavEntry(thisCourse));

        $('.unfav-icon').last()[0].courseId = thisCourse["_id"];

        // attach object to DOM element
        $('#favs').children().last()[0].course = thisCourse;
      }

      $('.unfav-icon').click(clickToUnFav)
    });
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

      $('#search-title').append(courses.length + ' Search Results')

      for (var courseIndex in courses) {
        var thisCourse = courses[courseIndex]

        var i = document.favorites.indexOf(thisCourse["_id"])
        if (i === -1) { // not a favorite
          var entry = $.parseHTML(newResultEntry(thisCourse))[0]

          entry.course = thisCourse
          $(entry).find(".fav-icon")[0].courseId = thisCourse["_id"]
          $(entry).find(".fav-icon").click(clickToFav)
          $('#results').append(entry)
        } else { // favorite
          var entry = $.parseHTML(newFavEntry(thisCourse))[0]

          entry.course = thisCourse
          $(entry).find(".unfav-icon")[0].courseId = thisCourse["_id"]
          $(entry).find(".unfav-icon").click(clickToUnFav)
          $('#results').append(entry)
        }
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

    if (winWidth < 770)
    {
      var backButton = '<div><button type="button" id="backButton" onclick="goBackToSearchResults();" class="btn btn-secondary">Back</div></span>'
      $('#search-pane').css("display", "none");
      $('#display-pane').css("display", "inline");
      $('body').css("background-color", "#ffffff");
      $('#disp-title').append(backButton);
      $(this).removeClass("active")
    }

    var thisCourse = this.course

    // string for course listings
    var listings =  getListings(thisCourse)

    $('#disp-title').append(thisCourse.title)

    $('#disp-subtitle').append(listings + ' '
                            + (thisCourse.distribution == undefined ? '' : ' <span class="label label-info">' + thisCourse.distribution + '</span>')
                            + (thisCourse.pdf["required"]  ? ' <span class="label label-warning">PDF ONLY</span>'
                            : (thisCourse.pdf["permitted"] ? ' <span class="label label-warning">PDF</span>'
                                                                   : ' <span class="label label-warning">NPDF</span>'))
                            + (thisCourse.audit ? ' <span class="label label-warning">AUDIT</span>' : '')
                            /*+ ' <span type="button" class="btn-primary btn-default btn-sm" id="fav-button" style="font-weight:bold">Favorite</span>'*/
                            + (thisCourse.website == undefined ? '' : ' <a href="' + thisCourse.website
                                                                      + '" target="_blank"><i class="fa fa-external-link"></i></a>'))

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
          var entry = $.parseHTML(newInstructorCourseEntry(thisCourse))[0];
          entry.course = thisCourse;
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

var goBackToSearchResults = function() {
  $('#search-pane').css("display", "inline");
  $('#display-pane').css("display", "none");
  $('body').css("background-color", "#dddddd");
}
