
// Return the height of the window
var getWindowHeight = function() {
	var windowHeight = $(window).height();
	return windowHeight;
}

// Return the width of the window
var getWindowWidth = function() {
	var windowWidth = $(window).width();
	return windowWidth;
}

// Return the id of searchbox depending on screen size
var getDeviceSearchBox = function() {
	if (getWindowWidth() > 768) { return "#searchbox"; }
	else { return "#mob-searchbox"; }
}