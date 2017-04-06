// update the favorites data for search pane
var updateSearchFav = function() {
  $("#results").children().each(function() {
    var isFav = (document.favorites.indexOf(this.course._id) !== -1)

    var icon = $(this).find("i")
    icon.removeClass(isFav ? 'fav-icon' : 'unfav-icon')
    icon.addClass(isFav ? 'unfav-icon' : 'fav-icon')
  })
}

// update the display of favorites upon new fav/unfav from course
// input course only on favoriting
var updateFavList = function(courseId, course) {

  $('#favorite-title').html('')
  $('#favorite-title').append(document.favorites.length + ' Favorite Course'+ (document.favorites.length !== 1 ? 's' : ''))

  var isFav = (document.favorites.indexOf(courseId) !== -1)

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
    if (this.course._id !== courseId) return

    // remove
    $(this).slideToggle(function() {
      this.remove()
    })
  })
}

// handles click of favorite icon
// - course is corresponding course object
var toggleFav = function(courseId) {
  var i = document.favorites.indexOf(courseId)

  // update local list
  if (i === -1)
    document.favorites.push(courseId)
  else
    document.favorites.splice(i, 1)

  // update database
  $.ajax({
    url: '/api/user/favorites/' + courseId,
    type: (i === -1) ? 'PUT' : 'DELETE'
  }).done(function (course) {
    // update display
    updateSearchFav()
    updateFavList(courseId, course)
  }).catch(function (error) {
    console.log(error)
  })

  return false;
}
