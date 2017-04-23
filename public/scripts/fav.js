// update the favorite heart icons
var updateFavIcons = function() {
  $(".fav-icon, .unfav-icon").each(function() {
    var isFav = (document.favorites.indexOf(this.courseId) !== -1)

    var icon = $(this)
    icon.tooltip('hide')
    icon.removeClass(isFav ? 'fav-icon' : 'unfav-icon')
    icon.addClass(isFav ? 'unfav-icon' : 'fav-icon')
    icon.attr('data-original-title', isFav ? 'Click to unfavorite' : 'Click to favorite')
  })
}

// update the display of favorites upon new fav/unfav from course
// input course only on favoriting
// i: index of course in local list before fav toggled
var updateFavList = function(courseId, course, i) {

  $('#favorite-title').html('')
  $('#favorite-title').append(document.favorites.length + ' Favorite Course'+ (document.favorites.length !== 1 ? 's' : ''))

  var isFav = (i === -1)

  // toggle title if necessary
  if ((document.favorites.length === 0 && $('#favorite-header').css('display') !== 'none')
   || (document.favorites.length  >  0 && $('#favorite-header').css('display') === 'none')) {
    $('#favorite-header').slideToggle()
  }

  // if newly a favorite
  if (isFav) {
    var entry = newDOMcourseResult(course, {"semester": 1, "tags": 1})
    $(entry).css('display', 'none')

    $('#favs').append(entry)
    $(entry).slideToggle()
    return
  }

  // if removing a favorite
  $("#favs").children().each(function() {
    // ignore if not this course
    if (this.courseId !== courseId) return

    // remove
    $(this).slideToggle(function() {
      this.remove()
    })
  })
}

// handles click of favorite icon
var toggleFav = function() {
  var courseId = this.courseId
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
    updateFavList(courseId, course, i)
    updateFavIcons()
    displayActive()
    setTimeout(searchFromBox, 10)
  }).catch(function (error) {
    console.log(error)
  })

  return false;
}
