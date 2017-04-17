// dependencies: resizable.js

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

// to initialize feedback mechanism
var init_feedback = function() {
  // submission
  $('#feedback-form').submit(function() {
    if ($('#feedback-text').val().length > 0)
    {
      var submitURL = ''
      submitURL += 'https://docs.google.com/a/princeton.edu/forms/d/e/1FAIpQLSdX3VTSbVfwOOtwMxhWiryQFrlBNuJDUTlp-lUmsV-S0xFM_g/formResponse?'
      submitURL += 'entry.1257302391=' + document.netid
      submitURL += '&entry.680057223=' + encodeURIComponent($('#feedback-text').val())

      $(this)[0].action = submitURL
      $('#feedback-submit').text('Thank You!')
      $('#feedback-submit').addClass('disabled')
      $('#feedback-text').attr('disabled', true)
      setTimeout(toggleFeedback, 1000)
    }
    else {
      $('#feedback-text').attr("placeholder", "Please enter feedback.");
    }
  })
  $('#feedback-toggle').click(function() {return toggleNavbar('feedback')})
}

// to intialize logout button
var init_logout = function() {
  $('#menu-bar').mouseleave(function() {
    var isNetidInvisible = $('#netid').css('display') === 'none'
    if (isNetidInvisible) $('#netid, #logout').animate({width: 'toggle'})
  })

  $('#netid').click(function() {
    var isLogoutVisible = $('#logout').css('display') !== 'none'
    if (!isLogoutVisible) $('#netid, #logout').animate({width: 'toggle'})
    return false;
  })
}

// to initialize updates popup
var init_updates = function() {
  var updateMessage = 'You can now search for instructors. Also, take a look at Search Suggestions!'
  var updateNo = 0 //  BENSU: increment this number for new updates
  var updateNoStored = localStorage.getItem('updateNo'); //last update seen by user
  $("#updates-bottom-popup").append(updateMessage);
  if (updateNo != updateNoStored) // new update
  {
    localStorage.setItem('updateRead', 'False');
    setTimeout(function() {
      $('#updates-bottom-popup').show();
    }, 1000); // milliseconds
    localStorage.setItem('updateNo', updateNo);
  }
  else {
    var updateRead = localStorage.getItem('updateRead');
    if (updateRead !== 'True') {
      setTimeout(function() {
        $('#updates-bottom-popup').show();
      }, 1000); // milliseconds
    }
  }
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
