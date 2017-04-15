
// toggles the feedback form
function toggleNavbar(element) {
  toggleFeedback()
  toggleFeedbackBodyClick()
  return false
}

// feedback form toggling
var toggleFeedback = function() {
  // hide menu if in mobile
  if (document.isMobile) $('.navbar-collapse').collapse('hide')

  // update navbar
  var isActive = $('#feedback-toggle').hasClass("active")
  if (isActive) $('#feedback-toggle').removeClass("active")
  else $('#feedback-toggle').addClass("active")

  // animate
  $('#feedback-container').slideToggle(function() {
    if($('#feedback-toggle').hasClass("active")) $('#feedback-text').focus()
  })
}

// hide feedback popup if clicked outside of div
var toggleFeedbackBodyClick = function() {
  $(document).on("click", function(event){
    var $trigger = $("#feedback-container");
    if($trigger !== event.target && !$trigger.has(event.target).length){
      $("#feedback-container").slideUp();
      $("#feedback-toggle").removeClass('active');
    }
  });
}
