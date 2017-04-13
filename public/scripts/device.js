/* BENSU: Responsive methods */

var prevWindowWidth = $(window).width();
var WIDTH_THRESHOLD = 768;

// Return the height of the window
var windowHeight = function() {
	var windowHeight = $(window).height();
	return windowHeight;
}

// Return the width of the window
var windowWidth = function() {
	var windowWidth = $(window).width();
	return windowWidth;
}

// return if the window is in mobile mode
var isMobile = function() {
	return (windowWidth() < WIDTH_THRESHOLD);
}

// initialize mobile screen
var init_mobile = function() {
	$('#searchbox').appendTo('#navbar-search-bar');
	$('#search-pane').css('width','100%');
	$('#info-pane').css('width','100%');
	$('#navbar-toggle-button').css('display','block');
	$('#searchform').css("display", "none");
}

// initialize desktop screen
var init_desktop = function() {
	$('#display-pane').css("display", "");
	$('#search-pane').css("display", "");
	$('#navbar-toggle-button').css("display", "none");
	$('#navbar-back-button').css("display", "none");
	$('#searchbox').appendTo('#search-pane-search-bar');
	var searchPaneWidth = localStorage.getItem('#search-resizer');
  if(searchPaneWidth !== undefined) {
    $('#search-pane').css('width', searchPaneWidth);
  }

  var infoPaneWidth = localStorage.getItem('#info-resizer');
  if(searchPaneWidth !== undefined) {
    $('#info-pane').css('width', infoPaneWidth);
  }
}

// modify css for resized window
var onresize = function() {
	// mobile to desktop
	if ((windowWidth() > WIDTH_THRESHOLD) && (prevWindowWidth <= WIDTH_THRESHOLD))
	{
	  setPaneWidth();
	  init_desktop();
	}

	//desktop to mobile
	if ((windowWidth() <= WIDTH_THRESHOLD) && (prevWindowWidth > WIDTH_THRESHOLD))
	{
	  init_mobile();
	  setPaneWidth();
	}
	prevWindowWidth = windowWidth();
}
window.addEventListener("resize", onresize);

// set widths of panels
var setPaneWidth = function() {
	if (isMobile()) { init_mobile(); }
	else if (!isMobile()) { init_desktop(); }
	$('#search-pane').css('display', "");
	$('#display-pane').css('display', "");
}