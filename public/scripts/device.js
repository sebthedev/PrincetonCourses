
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
	if (windowWidth() > 768) { return "#searchbox"; }
	else { return "#mob-searchbox"; }
}

var onresize = function() {
	if (windowWidth > 768)
	{
	  // //var backButton = '<div><button type="button" onclick="goBackToSearchResults();" class="btn btn-secondary">Back</div></span>'
	  // $('#search-pane').css("display", "");
	  // $('#display-pane').css("display", "");
	  // $('body').css("background-color", "#ffffff");
	  // $('#backButton').css("display", "none");
	}
	if (windowWidth <= 768)
	{
	  // //var backButton = '<div><button type="button" onclick="goBackToSearchResults();" class="btn btn-secondary">Back</div></span>'
	  // $('#search-pane').css("display", "");
	  // $('#display-pane').css("display", "none");
	  // $('body').css("background-color", "#dddddd");
	}
}
window.addEventListener("resize", onresize);