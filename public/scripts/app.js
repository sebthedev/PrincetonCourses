$(document).ready(function() {

  init_panes();
  init_searchpane();
  init_search();
  init_globals();

})

// to initialize draggability
var init_panes = function() {
  $('#search-pane').resizable({
    handles: 'e'
  })

  $('#info-pane').resizable({
    handles: 'w'
  })
}

// to initalize search pane section collapsing
var init_searchpane = function() {
  $('#favorite-courses').css('max-height', '30%')

    // toggle display of favorite things
  var toggleFavDisplay = function() {
    var isVisible = $('#favorite-courses').css('display') !== 'none'

    var icon = $('#fav-display-toggle')
    icon.removeClass(isVisible ? 'fa-minus' : 'fa-plus')
    icon.addClass(isVisible ? 'fa-plus' : 'fa-minus')
    $('#favorite-courses').slideToggle()
  }
  $('#fav-display-toggle').click(toggleFavDisplay)

  // toggle display of search result things
  var toggleSearchDisplay = function() {
    var isVisible = $('#search-results').css('display') !== 'none'

    var icon = $('#search-display-toggle')
    icon.removeClass(isVisible ? 'fa-minus' : 'fa-plus')
    icon.addClass(isVisible ? 'fa-plus' : 'fa-minus')
    $('#favorite-courses').animate({'max-height': (isVisible ? '100%' : '30%')})

    $('#search-results').slideToggle()
  }
  $('#search-display-toggle').click(toggleSearchDisplay)
}

// to initialize searching function
var init_search = function() {
  // Every time a key is pressed inside the #searchbox, call the searchForCourses function
  $('#searchbox').keyup(searchForCourses)
  $('#semester, #sort').change(searchForCourses)
}

// to initialize global data
var init_globals = function() {
  // Saving the user's netid so it is globally available
  document.netid = $("#netid").text()

  // construct local favorites list
  document.favorites = []
  $.get('/api/user/favorites', function(courses) {
    for (var course in courses) {
      document.favorites.push(courses[course]["_id"])
    }
  })
}
