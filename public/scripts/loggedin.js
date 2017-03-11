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

      for (var courseIndex in courses) {
        var thisCourse = courses[courseIndex]

        $('#results').append('<a class="list-group-item search-result"><div>' +
                             thisCourse.department + ' ' + thisCourse.catalogNumber +
                             (thisCourse.distribution == undefined ? '' : ' <span class="label label-info">' + thisCourse.distribution + '</span>') +
                             '</div><div>' + thisCourse.title + '</div></a>')

        // attach object to DOM element
        $('#results').children().last()[0].course = thisCourse
      }
    })
  }

  // Every time a key is pressed inside the #searchbox, call the getCourseData function
  $('#searchbox').keyup(getCourseData)
  $('#semester').change(getCourseData)

  // displays information in right pane on click of search result
  $('#results').on('click', 'a.search-result', function() {

    $(".search-result").removeClass("active");
    $(this).addClass("active")

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

  // load the semesters for the dropdown
  $.get('/api/semesters', function (semesters) {
    for (var semesterIndex in semesters) {
      var thisSemester = semesters[semesterIndex]
      $('#semester').append('<option value="' + thisSemester.code + '">' + thisSemester.name + '</select>')
    }
  })
})
