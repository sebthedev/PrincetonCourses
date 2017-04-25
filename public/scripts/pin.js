// dependencies: fav.js

// update the pin icons
var updatePinIcons = function() {
  $(".unpin-icon, .pin-icon").each(function() {
    var isPinned = (document.pins.indexOf(this.courseId) !== -1)

    var $icon = $(this)
    $icon.removeClass(isPinned ? 'pin-icon' : 'unpin-icon')
    $icon.addClass(isPinned ? 'unpin-icon' : 'pin-icon')
    $icon.attr('data-original-title', isPinned ? 'Pin this course to detect possible clashes!' : 'Click to unpin')
  })
}

// reload favorites with callback function
var refreshFavs = function(callback) {
  $('[data-toggle="tooltip"]').tooltip('hide') // remove tooltips

  $.get('/api/user/favorites', function(courses) {
    $('#favs').children().remove()

    for (var courseIndex in courses) {
      var thisCourse = courses[courseIndex]

      // append favorite into favs pane
      $('#favs').append(newDOMResult(thisCourse, {"semester": 1, "tags": 1, 'pin': 1}));

      updateFavIcons()
      displayActive()

      callback()
    }
  })
}

// handles click of pin icon
var togglePin = function() {
  var courseId = this.courseId
  var i = document.pins.indexOf(courseId)

  // update local list
  if (i === -1)
    document.pins.push(courseId)
  else
    document.pins.splice(i, 1)

  // update database
  $.ajax({
    url: '/api/user/clashDetectionCourses/' + courseId,
    type: (i === -1) ? 'PUT' : 'DELETE'
  }).done(function (course) {
    refreshFavs(updatePinIcons)
    setTimeout(searchFromBox, 10)
  }).catch(function (error) {
    console.log(error)
  })

  return false;
}
