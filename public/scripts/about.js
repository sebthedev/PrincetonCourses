// dependencies: navbar.js

// initialization
$(document).ready(function() {
  	$('.team-member>h4').matchHeight();
    init_navbar()

    // update mobile detection
    $(window).resize(function() {
      const WIDTH_THRESHOLD = 768;
      document.isMobile = ($(window).width() < WIDTH_THRESHOLD)
    })
})
