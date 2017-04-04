// dependencies: module.js, search.js, display.js


// initialization
$(document).ready(function() {

  init_load();
  init_panes();
  init_searchpane();
  init_search();
  init_globals();
  init_favorites();
  init_feedback();
  init_display();
  init_evals();
})

// loads course from url
var init_load = function() {
  // On pageload, check if the URL contains a valid course
  var pathnameMatch = /^\/course\/(\d+)$/.exec(window.location.pathname)
  if (pathnameMatch !== null && pathnameMatch.length === 2) {
      // Load the course
      displayCourseDetails(pathnameMatch[1])
  }
}

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

  // load the semesters for the dropdown
  $('#semester').children(":not([disabled])").remove()
  $.get('/api/semesters', function (semesters) {
    for (var semesterIndex in semesters) {
      var thisSemester = semesters[semesterIndex]
      var option = $(document.createElement('option')).attr('value', thisSemester._id).text(thisSemester.name)
      if (semesterIndex == 0) {
        option.attr('selected', true)
      }
      $('#semester').append(option)
    }
  })
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

// to initialize favorites list
var init_favorites = function() {
  // call api to get favorites and display
  $.get('/api/user/favorites', function(courses) {

    $('#favorite-header').css('display', (courses == undefined || courses.length == 0) ? 'none' : '')

    $('#favs').html('');
    $('#favorite-title').html('');

    $('#favorite-title').append(courses.length + ' Favorite Course' + (courses.length !== 1 ? 's' : ''))
    for (var courseIndex in courses) {
      var thisCourse = courses[courseIndex];

      // append favorite into favs pane
      $('#favs').append(newDOMResult(thisCourse, {"semester": 1, "tags": 1}));
    }
  })
}

// to initialize feedback mechanism
var init_feedback = function() {
  // feedback form toggling
  var toggleFeedback = function() {
    var isActive = $('#feedback-toggle').hasClass("active")
    if (isActive) $('#feedback-toggle').removeClass("active")
    else $('#feedback-toggle').addClass("active")

    $('#feedback-container').slideToggle(function() {
      if($('#feedback-toggle').hasClass("active")) $('#feedback-text').focus()
    })
  }

  // submission
  $('#feedback-form').one('submit', function() {
    var submitURL = ''
    submitURL += 'https://docs.google.com/a/princeton.edu/forms/d/e/1FAIpQLSdX3VTSbVfwOOtwMxhWiryQFrlBNuJDUTlp-lUmsV-S0xFM_g/formResponse?'
    submitURL += 'entry.1257302391=' + document.netid
    submitURL += '&entry.680057223=' + encodeURIComponent($('#feedback-text').val())

    $(this)[0].action = submitURL
    $('#feedback-submit').text('Thank You!')
    $('#feedback-submit').addClass('disabled')
    $('#feedback-text').attr('disabled', true)
    setTimeout(toggleFeedback, 1000)
  })


  $('#feedback-toggle').click(toggleFeedback)
}

// to initialize display toggling
var init_display = function() {
  $('#disp-instructors-toggle').click(function() {section_toggle('disp', 'instructors')})
  $('#disp-description-toggle').click(function() {section_toggle('disp', 'description')})
  $('#disp-assignments-toggle').click(function() {section_toggle('disp', 'assignments')})
  $('#disp-grading-toggle').click(function() {section_toggle('disp', 'grading')})
  $('#disp-prerequisites-toggle').click(function() {section_toggle('disp', 'prerequisites')})
  $('#disp-equivalent-toggle').click(function() {section_toggle('disp', 'equivalent')})
  $('#disp-other-toggle').click(function() {section_toggle('disp', 'other')})
  $('#disp-classes-toggle').click(function() {section_toggle('disp', 'classes')})
}

// to initialize evals toggling
var init_evals = function() {
  $('#evals-semesters-toggle').click(function() {section_toggle('evals', 'semesters')})
  $('#evals-numeric-toggle').click(function() {section_toggle('evals', 'numeric')})
  $('#evals-comments-toggle').click(function() {section_toggle('evals', 'comments')})
}

// toggles display / eval sections
var section_toggle = function(pane, section) {
  var body = $('#' + pane + '-' + section + '-body')
  var icon = $('#' + pane + '-' + section + '-toggle')
  var isVisible = (body.css('display') !== 'none')

  icon.removeClass(isVisible ? 'fa-minus' : 'fa-plus')
  icon.addClass(isVisible ? 'fa-plus' : 'fa-minus')
  body.slideToggle();
}
