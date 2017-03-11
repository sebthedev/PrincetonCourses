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

        $('#results').append('<a class="list-group-item list-square search-result"><div>' +
                             thisCourse.department + ' ' + thisCourse.catalogNumber +
                             ' <span class="label label-info">dist</span></div><div>' +
                             thisCourse.title + '</div></a>')
        // attach object to DOM element
        $('#results').children().last()[0].course = thisCourse
      }
    })
  }

  // Every time a key is pressed inside the #searchbox, call the getCourseData function
  $('#searchbox').keyup(getCourseData)
  $('#semester').change(getCourseData)

  $('#results').on('click', 'a.search-result', function() {
    console.log(this)
    $(".search-result").removeClass("active");
    this.addClass("active");

    $('#disp-title').html('')
    $('#disp-profs').html('')
    $('#disp-desc').html('')
    $('#disp-body').html('')

    var thisCourse = this.course
    $('#disp-title').append(thisCourse.department + ' ' + thisCourse.catalogNumber +
                         ' <small>' + thisCourse.title + '</small>')

    $('#disp-desc').append(thisCourse.description)

    $('#disp-body').append('<p>' + thisCourse.description + '</p><p>' + thisCourse.description + '</p><p>' +
                           thisCourse.description + '</p><p>' + thisCourse.description + '</p><p>' +
                           thisCourse.description + '</p><p>' +thisCourse.description + '</p>')
  })

  $.get('/api/semesters', function (semesters) {
    for (var semesterIndex in semesters) {
      var thisSemester = semesters[semesterIndex]
      $('#semester').append('<option value="' + thisSemester.code + '">' + thisSemester.name + '</select>')
    }
  })
})
