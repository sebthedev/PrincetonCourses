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

        // string for course listings
        var listings = thisCourse.department + ' ' + thisCourse.catalogNumber
        for (var listing in thisCourse.crosslistings) {
          listings += '/' + thisCourse.crosslistings[listing].department
                    + ' ' + thisCourse.crosslistings[listing].catalogNumber
        }

        $('#results').append('<a class="list-group-item search-result"><div>' +
                             listings +
                             (thisCourse.distribution == undefined ? '' : ' <span class="label label-info">' + thisCourse.distribution + '</span>') +
                             '</div><div>' + thisCourse.title + '</div></a>')

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

    var thisCourse = this.course

    // string for course listings
    var listings = thisCourse.department + ' ' + thisCourse.catalogNumber
    for (var listing in thisCourse.crosslistings) {
      listings += '/' + thisCourse.crosslistings[listing].department
                + ' ' + thisCourse.crosslistings[listing].catalogNumber

    }

    $('#disp-title').append(listings + ' <small>' + thisCourse.title
                            + (thisCourse.distribution == undefined ? '' : ' <span class="label label-info">' + thisCourse.distribution + '</span>')
                            + '</small>')

    $('#disp-desc').append(thisCourse.description)

    // stuff for course evaluations
    var evals = ""
    for (var field in thisCourse.evaluations.scores) {
      var val = thisCourse.evaluations.scores[field]
      evals += '<div class="row"><div class="col-xs-3"><p><strong>' + field + '</p></div>'
             + '<div class="col-xs-9"><div class="progress">'
             + '<div class="progress-bar progress-bar-success" role="progressbar"'
                 + ' style="width: ' + (val*20) + '%;">' + val + '</div>'// as percentage of 5
             + '<div class="progress-bar progress-bar-warning" role="progressbar"'
                 + ' style="width: ' + (100 - val*20) + '%;">' + '</div></div></div></div>'
    }

    $('#disp-body').append(evals
                            + (thisCourse.prerequisites == undefined ? '' :
                            '<h3>Prerequisites</h3><p>' + thisCourse.prerequisites + '</p>')
                            + (thisCourse.equivalentcourses == undefined ? '' :
                            '<h3>Equivalent Courses</h3><p>' + thisCourse.equivalentcourses + '</p>')
                            + (thisCourse.otherinformation == undefined ? '' :
                            '<h3>Other Information</h3><p>' + thisCourse.otherinformation + '</p>')
                            + (thisCourse.otherrequirements == undefined ? '' :
                            '<h3>Equivalent Courses</h3><p>' + thisCourse.otherrequirements + '</p>')
                            + (thisCourse.website == undefined ? '' :
                            '<h3>Website</h3><p>' + thisCourse.website + '</p>'))
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
