
// toggles the about popup, feedback form, or both
function toggleNavbar(element) {
  if (element === 'about') {
    if ($('#feedback-container').css('display') !== 'none') toggleFeedback()
    toggleAbout()
  } else {
    if ($('#about-popup').css('display') !== 'none') toggleAbout()
    toggleFeedback()
  }

  return false
}

// feedback form toggling
var toggleFeedback = function() {
  // update navbar
  var isActive = $('#feedback-toggle').hasClass("active")
  if (isActive) $('#feedback-toggle').removeClass("active")
  else $('#feedback-toggle').addClass("active")

  // animate
  $('#feedback-container').slideToggle(function() {
    if($('#feedback-toggle').hasClass("active")) $('#feedback-text').focus()
  })
}

// about popup toggling
var toggleAbout = function() {
  // update navbar
  var isVisible = $('#about-popup').css('display') !== 'none'
  if (isVisible) $('#about-toggle').removeClass('active')
  else  $('#about-toggle').addClass('active')

  // animate
  $('#about-popup').fadeToggle()
}
