// returns a html string for an instructor entry
function newInstructorCourseEntry(course) {
  var hasScore = (course.evaluations.hasOwnProperty('scores')
               && course.evaluations.scores.hasOwnProperty('Overall Quality of the Course'))

  if (hasScore)
    var score = course.evaluations.scores['Overall Quality of the Course']

  return (
    '<li class="list-group-item search-result">'
    + '<div class="flex-container-row">'
      + '<div class="flex-item-stretch truncate">'
        + '<strong>' + getListings(course) + '(' + course.semester.name + ')' + '</strong>'
      + '</div>'
      + '<div class="flex-item-rigid">'
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
}

// returns a DOM object for a search or favorite result of a course
function newDOMResult(course) {
  var isFav = (document.favorites.indexOf(course["_id"]) !== -1)

  var hasScore = (course.evaluations.hasOwnProperty('scores')
               && course.evaluations.scores.hasOwnProperty('Overall Quality of the Course'))

  if (hasScore)
    var score = course.evaluations.scores['Overall Quality of the Course']

  // html string for the DOM object
  var htmlString = (
    '<li class="list-group-item search-result">'
    + '<div class="flex-container-row">'
      + '<div class="flex-item-stretch truncate">'
        + '<strong>' + getListings(course) + '</strong>'
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

  var entry = $.parseHTML(htmlString)[0]
  entry.course = course
  $(entry).find('i')[0].courseId = course["_id"]
  $(entry).find('i').click(toggleFav)

  return entry
}

// update the favorites data for search pane
var updateSearchFav = function() {
  $("#results").children().each(function() {
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
  if ((document.favorites.length === 0 && $('#favorite-title').css('display') !== 'none')
   || (document.favorites.length  >  0 && $('#favorite-title').css('display') === 'none')) {
    $('#favorite-title').slideToggle()
  }

  // if newly a favorite
  if (isFav) {
    var entry = newDOMResult(course)
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
  if (i === -1) {
    $.ajax({
      url: '/api/user/favorite',
      type: 'PUT',
      data: {'course': thisCourseId}
    })
  } else {
    $.ajax({
      url: '/api/user/favorite',
      type: 'DELETE',
      data: {'course': thisCourseId}
    })
  }

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
