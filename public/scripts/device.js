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

var onresize = function() {
	// mobile to desktop
	if ((windowWidth() > WIDTH_THRESHOLD) && (prevWindowWidth <= WIDTH_THRESHOLD))
	{
	  $('#searchbox').val($('#mob-searchbox').val());
	}

	//desktop to mobile
	if ((windowWidth() <= WIDTH_THRESHOLD) && (prevWindowWidth > WIDTH_THRESHOLD))
	{
	  $('#mob-searchbox').val($('#searchbox').val());
	}
	prevWindowWidth = windowWidth();
}

window.addEventListener("resize", onresize);