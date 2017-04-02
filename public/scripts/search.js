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
