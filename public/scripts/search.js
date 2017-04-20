// dependencies: module.js, fav.js, display.js, history.js, suggest.js

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
  return '?' + parameters.join('&')

  // search += '&track=' + 'UGRD'
}

// update search results from the search box
var searchFromBox = function() {
  // query url
  var queryURL = getSearchQueryURL()

  var query = encodeURIComponent($('#searchbox').val())
  var semester = $('#semester').val()
  var sort = $('#sort').val()

  // save search into history
  history_search(queryURL)

  searchForCourses(query, semester, sort)
}

// function for updating search results
// -- noswipe to prevent swiping if on mobile
var searchForCourses = function (query, semester, sort, noswipe) {

  // construct search query
  var search = '/api/search/' + query
  search += '?semester=' + semester
  search += '&sort=' + sort
  // search += '&track=' + 'UGRD'

  if (query === undefined || query === null) query = ''

  // display search
  $('#searchbox').val(decodeURIComponent(query))
  if (semester) $('#semester').val(semester)
  if (sort) $('#sort').val(sort)

  // stop if no query
  if (query === '') {
    $('#results').children().remove();
    $('#search-title').text('0 Search Results')
    document.lastSearch = ''
    return false
  }

  // go to search pane for mobile
  if (document.isMobile && noswipe !== true) $('#main-pane').slick('slickGoTo', 1)

  // don't search if it's the same!
  if (document.lastSearch === search) return;
  document.lastSearch = search

  // store search value used
  localStorage.setItem("sort", $('#sort').val())

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

  var isVisible = $(body).css('display') !== 'none'

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
//  - 'tags' is defined => displays pdf/audit tags
function newDOMcourseResult(course, props) {
  var isFav = (document.favorites.indexOf(course["_id"]) !== -1)

  var hasScore = (course.hasOwnProperty('scores') && course.scores.hasOwnProperty('Overall Quality of the Course'))

  if (hasScore)
    var score = course.scores['Overall Quality of the Course']

  // append semester if appropriate
  var semester = props.hasOwnProperty('semester') ? '&nbsp;<small class="text-dim">' + course.semester.name + '</small>' : ''

  // tags: dist / pdf / audit
  var tags = ''
  if (props.hasOwnProperty('tags')) {
    if (course.distribution !== undefined) {
      var tipTag = distributions[course.distribution]
      tipTag = (tipTag !== undefined) ? ' title="' + tipTag + '"' : '';
      tags += ' <span class="text-info-dim"' + tipTag + '>' + course.distribution + '</span>'
    }
    if (course.hasOwnProperty('pdf')) {
      if (course.pdf.hasOwnProperty('required') && course.pdf.required) tags += ' <span title="PDF only" class="text-danger-dim">PDFO</span>'
      else if (course.pdf.hasOwnProperty('permitted') && !course.pdf.permitted) tags += ' <span title="No PDF" class="text-danger-dim">NPDF</span>'
    }
    if (course.audit) tags += ' <span title="Audit available" class="text-warning-dim">AUDIT</span>'
    if (tags !== '') tags = '<small>&nbsp;' + tags + '</small>'
  }

  var isPast = course.hasOwnProperty('scoresFromPreviousSemester') && course.scoresFromPreviousSemester
  var tipPast = isPast ? ' title="An asterisk * indicates a score from a different semester"' : ''

  // is this a new course
  var isNew = course.hasOwnProperty('new') && course.new

  var badgeColor = '#ddd' /* light grey */
  if (hasScore) badgeColor = colorAt(score)
  else if (isNew) badgeColor = '#92D4E3' /* blue */

  var badgeText = 'N/A'
  if (hasScore) badgeText = score.toFixed(2)
  else if (isNew) badgeText = 'New'
  if (isPast) badgeText += '*'

  var tip = (' title="' + mainListing(course) + crossListings(course) + '&#013;'
           + course.title + '"')

  var tipFav = ' title="' + (isFav ? 'Click to unfavorite' : 'Click to favorite') + '"'

  console.log(course)

  // html string for the DOM object
  var htmlString = (
    '<li class="list-group-item search-result"' + tip + '>'
    + '<div class="flex-container-row">'
      + '<div class="flex-item-stretch truncate">'
        + '<strong>' + mainListing(course) + crossListings(course) + tags + '</strong>'
      + '</div>'
      + '<div class="flex-item-rigid">'
        + '<i class="fa fa-heart ' + (isFav ? 'unfav-icon' : 'fav-icon') + '"' + tipFav + '></i> '
        + '<span' + tipPast + ' class="badge badge-score" style="background-color: ' + badgeColor + '">'
          + badgeText
        + '</span>'
      + '</div>'
    + '</div>'
    + '<div class="flex-container-row">'
      + '<div class="flex-item-stretch truncate">' + course.title + '</div>'
      + '<div class="flex-item-rigid">' + semester + '</div>'
    + '</div>'
  + '</li>'
  )

  var entry = $.parseHTML(htmlString)[0]                                     // create DOM object
  var icon = $(entry).find('i')[0]                                           // favorite icon
  entry.courseId = course._id                                                // attach course id to entry
  icon.courseId = course._id                                                 // attach course id to icon
  $(icon).click(toggleFav)                                                   // handle click to fav/unfav
  $(entry).click(displayResult)                                              // enable click to display

  return entry
}
