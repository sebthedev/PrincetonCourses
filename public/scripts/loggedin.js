// An example script that shows how the page can make a request to our server
$(document).ready(function () {
  // $.get('/api/whoami', function (data) {
  //   window.alert('Hi! Your netid is:' + data.netid)
  // })

  var getCourseData = function () {
    var query = $('#searchbox').val()

    $.post('/api/courses', {
      query: query
    }, function (courses) {
      $('#results').html('')

      for (var courseIndex in courses) {
        var thisCourse = courses[courseIndex]
        $('#results').append('<div>' + thisCourse.title + '</div>')
      }
    })
  }

  $('#searchbox').keyup(getCourseData)
})
