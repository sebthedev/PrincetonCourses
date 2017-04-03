// dependencies: module.js, fav.js, display.js

// function for updating search results
var searchForCourses = function () {
  // Construct the search query
  var query = {
    $text: {
      $search: $('#searchbox').val()
    },
    semester: $('#semester').val()
  }

  // Send the query to the server
  $.post('/api/courses', {
    query: JSON.stringify(query),
    sort: $('#sort').val(),
    brief: true
  }, function (courses, status) {
    // Basic error handling
    if (status !== 'success') {
      window.alert('An error occured and your search could not be completed.')
    }

    // Remove any search results already in the results pane
    $('#results').children().remove()

    // Update the search results sub-heading
    $('#search-title').text(courses.length + ' Search Result' + (courses.length !== 1 ? 's' : ''))

    // List the returned courses in the search results pane
    for (var courseIndex in courses) {
      var thisCourse = courses[courseIndex]
      $('#results').append(newDOMResult(thisCourse, {"tags": 1}))
    }
  })
}

// returns a DOM object for a search or favorite result of a course
// includes:
//   -- course object linking
//   -- clicking to favorite/unfavorite (+ course id linking for icon)
// props: properties for conditional rendering:
//  - 'semester' is defined => displays semester name too
function newDOMResult(course, props) {
  var isFav = (document.favorites.indexOf(course["_id"]) !== -1)

  var hasScore = (course.hasOwnProperty('scores') && course.scores.hasOwnProperty('Overall Quality of the Course'))

  if (hasScore)
    var score = course.scores['Overall Quality of the Course']

  // append semester if appropriate
  var semester = props.hasOwnProperty('semester') ? ' (' + course.semester.name + ')' : ''

  // tags: dist / pdf / audit
  var tags = ''
  if (props.hasOwnProperty('tags')) {
    if (course.distribution !== undefined) tags += ' <span class="text-info-dim">' + course.distribution + '</span>'
    if (course.pdf["required"]) tags += ' <span class="text-danger-dim">P</span>'
    else if (!course.pdf["permitted"]) tags += ' <span class="text-danger-dim">N</span>'
    if (course.audit) tags += ' <span class="text-warning-dim">A</span>'
    if (tags !== '') tags = '<small>\xa0' + tags + '</small>'
  }

  // html string for the DOM object
  var htmlString = (
    '<li class="list-group-item search-result" data-courseID="' + course._id + '">'
    + '<div class="flex-container-row">'
      + '<div class="flex-item-stretch truncate">'
        + '<strong>' + mainListing(course) + crossListings(course) + semester + tags + '</strong>'
      + '</div>'
      + '<div class="flex-item-rigid">'
        + '<i class="fa fa-heart ' + (isFav ? 'unfav-icon' : 'fav-icon') + '"></i> '
        + '<span class="badge"' + (hasScore ? ' style="background-color: ' + colorAt(score) + '"' : '') + '>'
          + (hasScore ? score.toFixed(2) : 'N/A')
        + '</span>'
      + '</div>'
    + '</div>'
    + '<div class="truncate">'
      + course.title
    + '</div>'
  + '</li>'
  )

  var entry = $.parseHTML(htmlString)[0]           // create DOM object
  entry.course = course                            // link to course object
  $(entry).find('i')[0].courseId = course["_id"]   // link to course id for fav icon
  $(entry).find('i').click(function(){return toggleFav(course)})              // enable click to fav/unfav
  $(entry).click(displayResult)

  return entry
}
