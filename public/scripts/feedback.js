
// to initialize feedback mechanism
var init_feedback = function() {
  // submission
  $('#feedback-form').submit(feedback_submit)
  $('#feedback-toggle').click(feedback_toggle)
  $(document).on("click", function(event){
    var $trigger = $("#feedback-container");
    if($trigger !== event.target && !$trigger.has(event.target).length){
      if ($('#feedback-form').is(':visible')) feedback_toggle()
    }
  });
}

// handle submitting of feedback
function feedback_submit() {
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
    setTimeout(feedback_toggle, 1000)
  }
  else {
    $('#feedback-text').focus()
    return false
  }
}

// feedback form toggling
function feedback_toggle() {
  // hide menu if in mobile
  if (document.isMobile) $('.navbar-collapse').collapse('hide')

  // update text
  if (!isVisible) {
    $('#feedback-submit').text('Submit')
    $('#feedback-text').val('')
    $('#feedback-submit').removeClass('disabled')
    $('#feedback-text').attr('disabled', false)
  }

  // update navbar
  var isVisible = $('#feedback-form').is(':visible')
  if (isVisible) $('#feedback-toggle').removeClass("active");
  else $('#feedback-toggle').addClass("active");

  // animate
  $('#feedback-container').slideToggle(function() {
    if(!isVisible) $('#feedback-text').focus()
  })

  return false
}
