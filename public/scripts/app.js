// dependencies: search.js, display.js, resizable.js, navbar.js, suggest.js, layout.js, demo.js, icon.js, pin.js

// initialization
$(document).ready(function() {

  /* init_load(); MEL: now loads after semesters have been loaded in init_search */
  init_layout();
  init_panes();
  init_searchpane();
  init_search();
  init_globals();
  init_favorites();
  init_navbar();
  init_demo();
  init_display();
  init_evals();
  init_suggest();
  init_updates();
  $('#main-pane').css('display', '');
})

// loads course from url
var init_load = function () {
  var courseId = ''

  // Parse course from the URL to determine which course (if any) to display on pageload
  var pathnameMatch = /^\/course\/(\d+)$/.exec(window.location.pathname)
  if (pathnameMatch !== null && pathnameMatch.length === 2) {
    // Load the course
    courseId = parseInt(pathnameMatch[1])
    if (!isNaN(courseId)) {
      displayCourseDetails(courseId)
      var courseDisplayed = true;
    }
  }

  // Parse search parameters, if any exist
  var parameters = parseSearchParameters(window.location.search)

  // perform search
  searchFromURL(parameters.search, parameters.semester, parameters.sort, parameters.track, parameters.filterClashes)

  // initialize history
  history_init(courseId, window.location.search)

  // handle displaying default page
  if (courseId === '' && (parameters.search === undefined || parameters.search === ''))
    displayCourseDetails(courseId)

}

// to initialize draggability
var init_panes = function() {
  var searchPaneWidth = localStorage.getItem('#search-resizer');
  if(searchPaneWidth !== undefined) {
    $('#search-pane').css('width', searchPaneWidth);
  }

  var infoPaneWidth = localStorage.getItem('#info-resizer');
  if(searchPaneWidth !== undefined) {
    $('#info-pane').css('width', infoPaneWidth);
  }

  $('#search-pane').show()
  $('#display-pane').show()

  $('#search-pane').resizable({
    handleSelector: "#search-resizer",
    resizeHeight: false
  })

  $('#info-pane').resizable({
    handleSelector: "#info-resizer",
    resizeHeight: false,
    resizeWidthFrom: 'left'
  })
}

// to initalize search pane section collapsing
var init_searchpane = function() {
  $('#favorite-courses').css('max-height', '30vh')
    // toggle display of favorite things
  var toggleFavDisplay = function() {
    var isVisible = $('#favorite-courses').is(':visible')

    var icon = $('#fav-display-toggle')
    icon.removeClass(isVisible ? 'fa-minus' : 'fa-plus')
    icon.addClass(isVisible ? 'fa-plus' : 'fa-minus')
    $('#favorite-courses').slideToggle()
  }
  $('#fav-display-toggle').click(toggleFavDisplay)

  // toggle display of search result things
  var toggleSearchDisplay = function() {
    var isVisible = $('#search-results').is(':visible')

    var icon = $('#search-display-toggle')
    icon.removeClass(isVisible ? 'fa-minus' : 'fa-plus')
    icon.addClass(isVisible ? 'fa-plus' : 'fa-minus')

    $('#search-results').slideToggle()

    // smoother transition: start from current height as max-height
    var currHeight = $('#favorite-courses').outerHeight()/$(window).outerHeight()*100 + 'vh'
    $('#favorite-courses').css('max-height', currHeight)

    // expand to full height as max-height
    var fullHeight = $('#favs').outerHeight()/$(window).outerHeight()*100
    fullHeight = ((fullHeight > 100) ? 100 : fullHeight) + 'vh'

    // animate
    $('#favorite-courses').animate({'max-height': (isVisible ? fullHeight : '30vh')}, function() {
      // unset max-height if search results are not visible
      if (isVisible) $('#favorite-courses').css('max-height', '')
    })
  }
  $('#search-display-toggle').click(toggleSearchDisplay)

  // toggle display of advanced search
  var toggleAdvancedDisplay = function() {
    var isVisible = $('#advanced-body').is(':visible')

    $('#advanced-title').text((isVisible ? 'Show' : 'Hide') + ' Advanced Search Options')

    $('#advanced-body').slideToggle()
  }
  $('#advanced-title').click(toggleAdvancedDisplay)
}

// to initialize searching function
var init_search = function() {
  // restore sort used
  var savedSort = localStorage.getItem("sort");
  $('#sort').val((savedSort !== undefined && savedSort !== null) ? savedSort : "commonName")

  // Every time a key is pressed inside the #searchbox, search
  $('#searchbox').on('input', searchFromBox)
  $('#semester, #sort, #advanced-grad-hide, #advanced-filter-clashes').change(searchFromBox)

  // Allow clicking the "Search" keyboard button on mobile
  if (document.isMobile) {
    $('#searchbox').keypress(function (event) {
      if (event.keyCode === 13) {
        $(this).blur()
      }
    })
  }

  // load the semesters for the dropdown
  $('#semester').children(":not([disabled])").remove()
  $.get('/api/semesters', function (semesters) {
    for (var semesterIndex in semesters) {
      var thisSemester = semesters[semesterIndex]
      var option = $(document.createElement('option')).attr('value', thisSemester._id).text(thisSemester.name)
      $('#semester').append(option)
    }
    if ($('#semester').data('query')) {
      $('#semester').children('[value=' + $('#semester').data('query') +']').attr('selected', true)
    } else {
      $('#semester').children().eq(1).attr('selected', true)
    }
  }).then(init_load)
}

// to initialize global data
var init_globals = function() {
  // Saving the user's netid so it is globally available
  document.netid = $("#netid").text()
}

// to initialize favorites list
var init_favorites = function() {
  // call api to get favorites and display
  document.favorites = []
  document.pins = []

  $.get('/api/user/favorites', function(courses) {

    var hasFavorites = (courses !== undefined && courses.length !== 0)
    if (hasFavorites) {
      $('#favorite-header').show()
      $('#favorite-prompt').hide()
    } else {
      $('#favorite-header').hide()
      $('#favorite-prompt').show()
    }

    $('#favs').html('');
    $('#favorite-title').html('');

    $('#favorite-title').append(courses.length + ' Favorite Course' + (courses.length !== 1 ? 's' : ''))
    for (var courseIndex in courses) {
      var thisCourse = courses[courseIndex];

      // Saving this user's favorite courses to the global scope
      document.favorites.push(thisCourse._id)

      // save local pinned course list
      if (thisCourse.clashDetectionStatus) document.pins.push(thisCourse._id)

      // append favorite into favs pane
      $('#favs').append(newDOMResult(thisCourse, {"semester": 1, "tags": 1, 'pin': 1}));

      updateFavIcons()
      updatePinIcons()
      displayActive()
    }
  })
}

// to initialize demo mechanism
var init_demo = function() {
  // conductInitialDemo(); // We need to make it so that the tour doesn't show on every page load
  $("#demo-toggle").click(conductInitialDemo)
}

// to initialize display toggling
var init_display = function() {
  $('#disp-instructors-toggle'  ).click(function() {section_toggle('disp', 'instructors')})
  $('#disp-description-toggle'  ).click(function() {section_toggle('disp', 'description')})
  $('#disp-readings-toggle'     ).click(function() {section_toggle('disp', 'readings')})
  $('#disp-assignments-toggle'  ).click(function() {section_toggle('disp', 'assignments')})
  $('#disp-grading-toggle'      ).click(function() {section_toggle('disp', 'grading')})
  $('#disp-prerequisites-toggle').click(function() {section_toggle('disp', 'prerequisites')})
  $('#disp-equivalent-toggle'   ).click(function() {section_toggle('disp', 'equivalent')})
  $('#disp-other-toggle'        ).click(function() {section_toggle('disp', 'other')})
  $('#disp-reserved-toggle'     ).click(function() {section_toggle('disp', 'reserved')})
  $('#disp-classes-toggle'      ).click(function() {section_toggle('disp', 'classes')})
}

// to initialize evals toggling
var init_evals = function() {
  $('#evals-semesters-toggle').click(function() {section_toggle('evals', 'semesters')})
  $('#evals-numeric-toggle').click(function() {section_toggle('evals', 'numeric')})
  $('#evals-comments-toggle').click(function() {section_toggle('evals', 'comments')})
}

// to initialize suggest display
var init_suggest = function() {
  suggest_load()
  $('#suggest-toggle').click(toggleSuggest)
  $('#suggest-allcourses-toggle'   ).click(function() {section_toggle('suggest', 'allcourses')})
  $('#suggest-distributions-toggle').click(function() {section_toggle('suggest', 'distributions')})
  $('#suggest-pdfoptions-toggle'   ).click(function() {section_toggle('suggest', 'pdfoptions')})
  $('#suggest-departments-toggle'  ).click(function() {section_toggle('suggest', 'departments')})
}

// to initialize updates popup
var init_updates = function() {
  var updateMessage = 'Princeton Courses is now optimized for mobile and will warn you if courses you\'re searching for have time conflicts with your favorite courses. Happy course selection!'
  var updateNo = 2 //  BENSU: increment this number for new updates
  var updateNoStored = localStorage.getItem('updateNo'); //last update seen by user
  $("#updates-bottom-popup").append(updateMessage);
  if (updateNo != updateNoStored) // new update
  {
    localStorage.setItem('updateRead', 'False');
    setTimeout(function() {
      $('#updates-bottom-popup').show();
    }, 1000); // milliseconds
    localStorage.setItem('updateNo', updateNo);
  }
  else {
    var updateRead = localStorage.getItem('updateRead');
    if (updateRead !== 'True') {
      setTimeout(function() {
        $('#updates-bottom-popup').show();
      }, 1000); // milliseconds
    }
  }
}

// toggles display / eval sections
var section_toggle = function(pane, section) {
  var body = $('#' + pane + '-' + section + '-body')
  var icon = $('#' + pane + '-' + section + '-toggle')
  var isVisible = (body.is(':visible'))

  icon.removeClass(isVisible ? 'fa-minus' : 'fa-plus')
  icon.addClass(isVisible ? 'fa-plus' : 'fa-minus')
  body.slideToggle();
}

// update is read by the user
var saveUpdatePopupState = function() {
  localStorage.setItem('updateRead', 'True');
}

// to initialize responsive layout
var init_layout = function() {
  // initial layout
  var width = $(window).width()
  document.isMobile = (width < WIDTH_THRESHOLD)
  if (document.isMobile) {
    $('#main-pane').css('display', '');
    layout_mobile();
  }
  else layout_desktop()

  layout_initial_show()

  // bind to resizing
  $(window).resize(layout_refresh)

  $('#menu-back').click(function() {
    window.history.back();
  })

  // Initialise Bootstrap tooltips
  $('body').tooltip({
    selector: '[data-toggle="tooltip"]',
    container: 'body',
    trigger : 'hover',
    delay: 200
  });

  document.isReady = true;
}
