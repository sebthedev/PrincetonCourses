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

// Return the id of searchbox depending on screen size
var getDeviceSearchBox = function() {
	if (windowWidth() > WIDTH_THRESHOLD) { return "#searchbox"; }
	else { return "#mob-searchbox"; }
}

// return if the window is in mobile mode
var isMobile = function() {
	return (windowWidth() < WIDTH_THRESHOLD);
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
	  setPaneWidth();
	  init_search();
	}

	//desktop to mobile
	if ((windowWidth() <= WIDTH_THRESHOLD) && (prevWindowWidth > WIDTH_THRESHOLD))
	{
	  $('#mob-searchbox').val($('#searchbox').val());
	  $('#navbar-toggle-button').css('display','block');
	  $('#searchform').css("display", "none");
	  setPaneWidth();
	  init_search();
	}
	prevWindowWidth = windowWidth();
}
window.addEventListener("resize", onresize);

// set widths of panels
var setPaneWidth = function() {
	if (isMobile())
	{	
		$('#search-pane').css('width','100%')
		$('#info-pane').css('width','100%')
	}
	else if (!isMobile())
	{
		var searchPaneWidth = localStorage.getItem('#search-resizer');
	  if(searchPaneWidth !== undefined) {
	    $('#search-pane').css('width', searchPaneWidth);
	  }

	  var infoPaneWidth = localStorage.getItem('#info-resizer');
	  if(searchPaneWidth !== undefined) {
	    $('#info-pane').css('width', infoPaneWidth);
	  }
	}
	$('#search-pane').css('display', "");
	$('#display-pane').css('display', "");
}