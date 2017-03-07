// An example script that shows how the page can make a request to our server
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
        $('#results').append('<a href="#" class="list-group-item list-square"><div>' +
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
