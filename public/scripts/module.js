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
        + '<strong>' + getListings(course) + semester + tags + '</strong>'
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
  $(entry).find('i').click(toggleFav)              // enable click to fav/unfav

  return entry
}

// update the favorites data for search pane and professors pane
var updateSearchFav = function() {
  $("#results, #prof-courses").children().each(function() {
    var isFav = (document.favorites.indexOf(this.course["_id"]) !== -1)

    var icon = $(this).find("i")
    icon.removeClass(isFav ? 'fav-icon' : 'unfav-icon')
    icon.addClass(isFav ? 'unfav-icon' : 'fav-icon')
  })
}

// update the display of favorites upon new fav/unfav from course
var updateFavList = function(course) {
  var thisCourseId = course["_id"]

  $('#favorite-title').html('')
  $('#favorite-title').append(document.favorites.length + ' Favorite Course'+ (document.favorites.length !== 1 ? 's' : ''))

  var isFav = (document.favorites.indexOf(thisCourseId) !== -1)

  // toggle title if necessary
  if ((document.favorites.length === 0 && $('#favorite-header').css('display') !== 'none')
   || (document.favorites.length  >  0 && $('#favorite-header').css('display') === 'none')) {
    $('#favorite-header').slideToggle()
  }

  // if newly a favorite
  if (isFav) {
    var entry = newDOMResult(course, {"semester": 1, "tags": 1})
    entry.setAttribute('style', 'display: none;')

    $('#favs').append(entry)
    $(entry).slideToggle()
    return
  }

  // if removing a favorite
  $("#favs").children().each(function() {
    // ignore if not this course
    if (this.course["_id"] !== thisCourseId) return

    // remove
    $(this).slideToggle(function() {
      this.remove()
    })
  })
}

// handles click of favorite icon
var toggleFav = function() {
  var course = $(this).parents("li.search-result")[0].course
  var thisCourseId = this.courseId
  var i = document.favorites.indexOf(thisCourseId)

  // update local list
  if (i === -1)
    document.favorites.push(thisCourseId)
  else
    document.favorites.splice(i, 1)

  // update display
  updateSearchFav()
  updateFavList(course)

  // update database
  console.log((i === -1) ? 'PUT' : 'DELETE')
  $.ajax({
    url: '/api/user/favorites/' + thisCourseId,
    type: (i === -1) ? 'PUT' : 'DELETE'
}).done(function (data, status) {
    console.log(data, status)
})

  return false;
}

// returns a string of the course listings of the given course
function getListings(course) {
  listings = course.department + course.catalogNumber
  for (var listing in course.crosslistings) {
    listings += '/' + course.crosslistings[listing].department
                    + course.crosslistings[listing].catalogNumber
  }

  return listings
}

// returns as a string a color at the given score
function colorAt(score) {
  if (score > 4.5)
    return '#2e7d32' // deeper green
  else if (score > 4.0)
    return '#4caf50' // brighter green
  else if (score > 3.5)
    return '#8bc34a' // lighter green
  else if (score > 3.0)
    return '#c6cf37' // olive
  else if (score > 2.5)
    return '#ffca28' // yellow
  else if (score > 2.0)
    return '#ef9100' // orange
  else if (score > 1.5)
    return '#d9534f' // brighter red
  else
    return '#bf360c' // deeper red
}
