/* BENSU: Mobile-only methods */

// Go back to search results
var goBackToSearch = function() {
  $('#search-pane').css('display','block')
  $('#display-pane').css('display','none')
  $('#navbar-toggle-button').css('display','block')
  $('#navbar-back-button').css('display','none')
}

var goToCoursePage = function() {
	$('#search-pane').css('display','none')
  $('#display-pane').css('display','block')
  $('#navbar-toggle-button').css('display','none')
  $('#navbar-back-button').css('display','block')
  $('#navigation-bar').hide();
  document.getElementById("navigationbar").setAttribute("aria-expanded", false);
}