// dependencies: fav.js, display.js, history.js, suggest.js, icon.js, pin.js

var getSearchQueryURL = function () {
  var parameters = []
  if ($('#searchbox').val() != null) {
    parameters.push('search=' + $('#searchbox').val())
  }
  if ($('#semester').val() != null) {
    parameters.push('semester=' + $('#semester').val())
  }
  if ($('#sort').val() != null) {
    parameters.push('sort=' + $('#sort').val())
  }
  if ($('#advanced-filter-clashes').is(':checked')) {
    parameters.push('filterClashes=true')
  }
  return '?' + parameters.join('&')
}

// update search results from the search box
var searchFromBox = function(noswipe) {
  // query url
  var queryURL = getSearchQueryURL()

  var query = encodeURIComponent($('#searchbox').val())
  var semester = $('#semester').val()
  var sort = $('#sort').val()
  var filterClashes = $('#advanced-filter-clashes').is(':checked')

  // save search into history
  history_search(queryURL)

  searchForCourses(query, semester, sort, filterClashes, noswipe)
}

// update search results from a URL
var searchFromURL = function(query, semester, sort, filterClashes, noswipe) {
  // display search
  if (query) $('#searchbox').val(decodeURIComponent(query))
  if (semester) $('#semester').val(semester)
  if (sort) $('#sort').val(sort)
  $('#advanced-filter-clashes')[0].checked = (filterClashes === 'true')

  searchForCourses(query, semester, sort, filterClashes, noswipe)
}

// function for updating search results
// -- noswipe to prevent swiping if on mobile
var searchForCourses = function (query, semester, sort, filterClashes, noswipe) {
  if (query === undefined || query === null) query = ''

  // construct search query
  var search = '/api/search/' + query
  search += '?semester=' + semester
  search += '&sort=' + sort
  search += '&detectClashes=' + (filterClashes ? 'filter' : 'true')

  // stop if no query
  if (query === '') {
    $('#results').children().remove();
    $('#search-title').text('0 Search Results')
    document.lastSearch = ''
    $('#search-load-indicator').hide()
    $('#search-results').stop().css('opacity', '')
    updateSuggest()
    return false
  }

  // go to search pane for mobile and hide favorites
  if (document.isMobile && noswipe !== true) {
    $('#main-pane').slick('slickGoTo', 1)
    // if ($('#fav-display-toggle').hasClass('fa-minus')) $('#fav-display-toggle').click()
  }

  // store search value used
  localStorage.setItem("sort", $('#sort').val())

  $('#search-load-indicator').show()
  $('#search-results').stop().animate({'opacity': '0.5'})

  updateSuggest()

  // search!
  $.get(search, function (results, success, xhr) {
    if (!success) {
      window.alert('An error occured and your search could not be completed.')
      return false
    }

    // Discard the response if the query does not match the text currently in the search box
    if (decodeURIComponent(query) !== $('#searchbox').val()) {
      return false
    }

    // Check whether there is a clash among the favorite courses
    if (results.length > 0 && results[0].hasOwnProperty('favoritesClash') && results[0].favoritesClash) {
      $('#fav-clash-indicator').show()
    } else {
      $('#fav-clash-indicator').hide()
    }

    // Remove any search results already in the results pane
    $('#results').children().remove()

    var len = results.length

    // Update the search results sub-heading
    $('#search-title').text(len + ' Search Result' + (len !== 1 ? 's' : ''))

    // List the returned courses in the search results pane
    for (var index in results) {
      var result = results[index]
      if (result) {
        $('#results').append(newDOMResult(result, {"tags": 1}))
      }
    }

    displayActive() // update highlighting of active course

    $('#search-load-indicator').hide()
    $('#search-results').stop().css('opacity', '')
  })

}

// returns a DOM object for a search result
function newDOMResult(result, props) {
  if (result.type === 'instructor') return newDOMinstructorResult(result, props)
  /*if (result.type === 'course')*/ return newDOMcourseResult(result, props)
}

// returns a DOM object for a search result of an instructor
function newDOMinstructorResult(instructor, props) {
  var name = instructor.name.first + ' ' + instructor.name.last

  // html string for the DOM object
  var htmlString = (
    '<li class="list-group-item instructor-list-item">'
    + '<div class="flex-container-row">'
      + '<div class="flex-item-stretch truncate instructor-title">'
        + '<strong class="instructor-title">' + name + '</strong>'
      + '</div>'
      + '<div class="flex-item-rigid">'
        + '<span class="badge">' + instructor.courses.length + '</span> '
        + '<i class="text-button fa fa-lg fa-caret-down"></i>'
      + '</div>'
    + '</div>'
    + '<ul class="list-group instructor-body" style="display:none;">'
    + '</ul>'
  + '</li>'
  )

  var entry = $.parseHTML(htmlString)[0]  // create DOM object
  var icon = $(entry).find('i')[0]        // find icon
  var title = $(entry).find('.instructor-title')    // instructor name
  icon.instructorId = instructor._id      // attach instructor id
  var body = $(entry).find('ul')[0]       // body of instructor result
  $(icon).click(function() {toggleInstructor(icon, body, entry); return false})
  $(entry).click(function() {toggleInstructor(icon, body, entry); return false})

  return entry
}

// handles clicking the button to toggle instructors
// - icon: DOM object of toggling icon
// - body: DOM object of place to insert courses
// - entry: DOM object of whole entry
function toggleInstructor(icon, body, entry) {
  var isEmpty = $(body).is(':empty')

  if (isEmpty) {
    loadInstructor(icon, body, entry)
    return
  }

  var isVisible = $(body).is(':visible')

  $(icon).removeClass(isVisible ? 'fa-caret-up' : 'fa-caret-down')
  $(icon).addClass(isVisible ? 'fa-caret-down' : 'fa-caret-up')
  if (isVisible) $(entry).removeClass('instructor-list-item-opened')
  else $(entry).addClass('instructor-list-item-opened')
  $(body).slideToggle()
}

// handles loading instructor courses
// - icon: DOM object of toggling icon
// - body: DOM object of place to insert courses
// - entry: DOM object of whole entry
function loadInstructor(icon, body, entry) {
  $.get('/api/instructor/' + icon.instructorId, function (instructor) {
    // Stop if already loaded
    if (!$(body).is(':empty')) return;

    var courses = instructor.courses;
    for (var index in courses) {
      var course = courses[index]
      $(body).append(newDOMcourseResult(course, {'tags' : 1, 'semester': 1}))
    }

    $(icon).removeClass('fa-caret-down')
    $(icon).addClass('fa-caret-up')
    $(entry).addClass('instructor-list-item-opened')
    displayActive()
    $(body).slideToggle()
  })
}

// returns a DOM object for a search or favorite result of a course
// includes:
//   -- course object linking
//   -- clicking to favorite/unfavorite (+ course id linking for icon)
// props: properties for conditional rendering:
//  - 'semester' is defined => displays semester name too
//  - 'pin' is defined => displays pin to select courses for course clash
//  - 'tags' is defined => displays pdf/audit tags
function newDOMcourseResult(course, props) {
  // append semester if appropriate
  var semester = props.hasOwnProperty('semester') ? '&nbsp;<small class="text-muted">' + course.semester.name + '</small>' : ''

  // tags: dist / pdf / audit
  var tags = ''
  if (props.hasOwnProperty('tags')) tags = '<small>' + newHTMLtags(course) + '</small>'

  // clash icon
  var clashIcon = ''
  if (course.clash) clashIcon = '<i class="fa fa-warning text-danger" data-toggle="tooltip" data-original-title="This course clashes with one or more of your pinned courses."></i>'

  // pin icon for selecting courses (only in fav list)
  var hasPinIcon = (props.hasOwnProperty('pin') && !course.clash)
  var pinIcon = ''
  if (hasPinIcon) pinIcon = '<i class="fa fa-lg fa-thumb-tack pin-icon" data-toggle="tooltip" data-original-title="Pin this course to detect possible clashes!"></i>'

  // dot to indicate openness
  var dot = ''
  if (course.hasOwnProperty('open')) dot = newHTMLlock(course)

  // html string for the DOM object
  var htmlString = (
    '<li class="list-group-item search-result">'
    + '<div class="flex-container-row">'
      + '<div class="flex-item-stretch truncate">'
        + dot + ' '
        + '<strong>' + newHTMLlistings(course) + '</strong> ' + tags
      + '</div>'
      + '<div class="flex-item-rigid">'
        + '&nbsp;'
        + pinIcon + ' '
        + clashIcon + ' '
        + newHTMLfavIcon(course._id) + ' '
        + newHTMLscoreBadge(course)
      + '</div>'
    + '</div>'
    + '<div class="flex-container-row">'
      + '<div class="flex-item-stretch truncate">' + course.title + '</div>'
      + '<div class="flex-item-rigid">' + semester + '</div>'
    + '</div>'
  + '</li>'
  )

  var entry = $.parseHTML(htmlString)[0]                                     // create DOM object
  var icon = $(entry).find('i.fa-heart')[0]                                  // favorite icon
  entry.courseId = course._id                                                // attach course id to entry
  icon.courseId = course._id                                                 // attach course id to icon
  $(icon).click(toggleFav)                                                   // handle click to fav/unfav
  $(entry).click(displayResult)                                              // enable click to display

  // bind pin icons
  if (hasPinIcon) {
    var pin = $(entry).find('i.fa-thumb-tack')[0]
    pin.courseId = course._id
    $(pin).click(togglePin)
  }

  return entry
}
