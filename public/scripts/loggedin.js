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

      /* SEB'S EXAMPLE

      // Insert the course results into the area
      for (var courseIndex in courses) {
        var thisCourse = courses[courseIndex]
        $('#results').append('<div class="course"><span style="font-weight:bold">' + thisCourse.department + ' ' + thisCourse.catalogNumber + '</span> ' + thisCourse.title + '</div>')
        $('#results').children().last()[0].course = thisCourse

      */

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
    $('#disp-profs').html('')
    $('#disp-desc').html('')
    $('#disp-body').html('')
    $('#evals').html('')

    var thisCourse = this.course

    // string for course listings
    var listings =  getListings(thisCourse)

    $('#disp-title').append(listings + ' <small>'
                            + (thisCourse.distribution == undefined ? '' : ' <span class="label label-info">' + thisCourse.distribution + '</span>')
                            + (thisCourse.pdf["required"]  ? ' <span class="label label-warning">PDF ONLY</span>'
                            : (thisCourse.pdf["permitted"] ? ' <span class="label label-warning">PDF</span>'
                                                                   : ' <span class="label label-warning">NPDF</span>'))
                            + (thisCourse.audit ? ' <span class="label label-warning">AUDIT</span>' : '')
                            + '<br/>'  + thisCourse.title + '</small>')

    $('#disp-desc').append(thisCourse.description)

    // stuff for course evaluations
    var evals = ""
    for (var field in thisCourse.evaluations.scores) {
      var val = thisCourse.evaluations.scores[field]
      evals += '<div>' + field + '</div>'
             + '<div class="progress"><div class="progress-bar progress-bar-success" role="progressbar" '
             + 'style="width: ' + (val*20) + '%;">' + val + '</div></div>' // as percentage of 5
    }

    $('#evals').append(evals)

    $('#disp-body').append(   (thisCourse.prerequisites == undefined ? '' :
                            '<h3>Prerequisites</h3><p>' + thisCourse.prerequisites + '</p>')
                            + (thisCourse.equivalentcourses == undefined ? '' :
                            '<h3>Equivalent Courses</h3><p>' + thisCourse.equivalentcourses + '</p>')
                            + (thisCourse.otherinformation == undefined ? '' :
                            '<h3>Other Information</h3><p>' + thisCourse.otherinformation + '</p>')
                            + (thisCourse.otherrequirements == undefined ? '' :
                            '<h3>Equivalent Courses</h3><p>' + thisCourse.otherrequirements + '</p>')
                            + (thisCourse.website == undefined ? '' :
                            '<h3>Website</h3><p><a href="' + thisCourse.website + '" target="_blank">' + thisCourse.website + '</a></p>'))

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

  // load the semesters for the dropdown
  $.get('/api/semesters', function (semesters) {
    for (var semesterIndex in semesters) {
      var thisSemester = semesters[semesterIndex]
      $('#semester').append('<option value="' + thisSemester.code + '">' + thisSemester.name + '</select>')
    }
  })
})
