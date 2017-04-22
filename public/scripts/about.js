// initialization
$(document).ready(function() {
  init_globals();
  init_feedback();
  init_logout();
  init_updates();
})

// to initialize global data
var init_globals = function() {
  // Saving the user's netid so it is globally available
  document.netid = $("#netid").text()
}

// to intialize logout button
var init_logout = function() {
  $('#menu-bar').mouseleave(function() {
    var isNetidInvisible = !$('#netid').is(':visible')
    if (isNetidInvisible) $('#netid, #logout').animate({width: 'toggle'})
  })

  $('#netid').click(function() {
    var isLogoutVisible = $('#logout').is(':visible')
    if (!isLogoutVisible) $('#netid, #logout').animate({width: 'toggle'})
    return false;
  })
}

// toggles the feedback form
function toggleNavbar(element) {
  toggleFeedback()
  toggleFeedbackBodyClick()
  return false
}

// feedback form toggling
var toggleFeedback = function() {
  // update navbar
  var isActive = $('#feedback-toggle').hasClass("active")
  if (isActive)
  {
    $('#feedback-toggle').removeClass("active");
  }
  else
  {
    $('#feedback-toggle').addClass("active");
    $('#feedback-form').removeAttr("onkeypress");
  }

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
