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

// Return the id of searchbox depending on screen size
var getDeviceSearchBox = function() {
	if (windowWidth() > WIDTH_THRESHOLD) { return "#searchbox"; }
	else { return "#mob-searchbox"; }
}

// modify css for resized window
var onresize = function() {
	// mobile to desktop
	if ((windowWidth() > WIDTH_THRESHOLD) && (prevWindowWidth <= WIDTH_THRESHOLD))
	{
	  $('#searchbox').val($('#mob-searchbox').val());
	  $('#display-pane').css("display", "");
	  $('#search-pane').css("display", "");
	  $('#navbar-toggle-button').css("display", "none");
	  $('#navbar-back-button').css("display", "none");
	  $('#searchform').css("display", "");
	  init_search();
	}

	//desktop to mobile
	if ((windowWidth() <= WIDTH_THRESHOLD) && (prevWindowWidth > WIDTH_THRESHOLD))
	{
	  $('#mob-searchbox').val($('#searchbox').val());
	  $('#navbar-toggle-button').css('display','block');
	  $('#searchform').css("display", "none");
	  init_search();
	}
	prevWindowWidth = windowWidth();
}

window.addEventListener("resize", onresize);