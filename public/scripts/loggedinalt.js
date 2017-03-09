// An example script that shows how the page can make a request to our server

// MEL: copied from loggedin.js and edited
// MEL: something crude to get course data to pop up and update highlighting of active search result
// MEL: does this constitute a global var??
var displayCourseData = function(course_id, object) {
   // MEL: updates which search result is highlighted.
   $(".search-result").removeClass("active");
   object.addClass("active");

   // MEL: This thing asks for /api/course_by_id in app.js I think.
   $.post('/api/course_by_id',
          {
             course_id: course_id
          },
          function (courses) {
             // MEL: Clear these elements?
             $('#disp-title').html('')
             $('#disp-profs').html('')
             $('#disp-desc').html('')
             $('#disp-body').html('')

             // MEL: Display the thing. Not sure if for loop is necessary but it works so I won't touch it
             for (var courseIndex in courses) {
               var thisCourse = courses[courseIndex]
               $('#disp-title').append(thisCourse.department + ' ' + thisCourse.catalogNumber +
                                    ' <small>' + thisCourse.title + '</small>')

               $('#disp-desc').append(thisCourse.description)

               $('#disp-body').append('<p>' + thisCourse.description + '</p><p>' + thisCourse.description + '</p><p>' +
                                      thisCourse.description + '</p><p>' + thisCourse.description + '</p><p>' +
                                      thisCourse.description + '</p><p>' +thisCourse.description + '</p>')
             }
         }
    )
}

$(document).ready(function () {
  // $.get('/api/whoami', function (data) {
  //   window.alert('Hi! Your netid is:' + data.netid)
  // })
  var getCourseData = function () {
    var query = $('#searchbox').val()

    $.post('/api/courses', {
      query: query,
      semester: $('#semester').val()
    }, function (courses) {
      $('#results').html('')

      for (var courseIndex in courses) {
        var thisCourse = courses[courseIndex]

        // MEL: editted to print out an <a> element instead for the search panel
        // MEL: note the onclick event calls displayCourseData (above) with the course id
        // MEL: and the object itself
        $('#results').append('<a onclick="displayCourseData(' + thisCourse._id +
                           ',$(this))" class="list-group-item list-square search-result"><div>' +
                             thisCourse.department + ' ' + thisCourse.catalogNumber +
                             ' <span class="label label-info">dist</span></div><div>' +
                             thisCourse.title + '</div></a>')
      }
    })
  }

  // Every time a key is pressed inside the #searchbox, call the getCourseData function
  $('#searchbox').keyup(getCourseData)
  $('#semester').change(getCourseData)

  $.get('/api/semesters', function (semesters) {
    for (var semesterIndex in semesters) {
      var thisSemester = semesters[semesterIndex]
      $('#semester').append('<option value="' + thisSemester.code + '">' + thisSemester.name + '</select>')
    }
  })
})
