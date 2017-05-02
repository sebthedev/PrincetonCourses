// dependencies: search.js, display.js, resizable.js, navbar.js, suggest.js, layout.js, demo.js, icon.js, pin.js

// initialization
$(document).ready(function() {

  /* init_load(); MEL: now loads after semesters have been loaded in init_search */
  init_layout();
  init_searchpane();
  init_panes();
  init_search();
  init_globals();
  init_favorites();
  init_navbar();
  init_demo();
  init_display();
  init_evals();
  init_suggest();
  init_updates();
})

// loads course from url
var init_load = function () {
  var courseId = ''

  var disp_noswipe = false
  var search_noswipe = true

  // Parse course from the URL to determine which course (if any) to display on pageload
  var pathnameMatch = /^\/course\/(\d+)$/.exec(window.location.pathname)
  if (pathnameMatch !== null && pathnameMatch.length === 2) {
    // Detect if course is to be displayed
    courseId = parseInt(pathnameMatch[1])
    if (isNaN(courseId)) {
      disp_noswipe = true
      search_noswipe = false
      courseId = ''
    }
  } else {
    disp_noswipe = true
    search_noswipe = false
    courseId = ''
  }

  // display course
  displayCourseDetails(courseId, disp_noswipe)

  // Parse search parameters, if any exist
  var parameters = parseSearchParameters(window.location.search)

  // perform search
  searchFromURL(parameters.search, parameters.semester, parameters.sort, parameters.track, parameters.filterClashes, search_noswipe)

  // initialize history
  history_init(courseId, window.location.search)
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

  var suggestPaneWidth = localStorage.getItem('#suggest-resizer');
  if(suggestPaneWidth !== undefined) {
    $('#suggest-pane').css('width', suggestPaneWidth);
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

  $('#suggest-pane').resizable({
    handleSelector: "#suggest-resizer",
    resizeHeight: false
  })
}

// to initalize search pane section collapsing
var init_searchpane = function() {
  // return the last saved height of fav section
  var getFavHeight = function() {
    var favHeight = localStorage.getItem('#search-header');
    if (favHeight === undefined) favHeight = '30vh'
    return favHeight
  }

  // make fav section resizable
  $('#favorite-courses').resizable({
    handleSelector: '#search-header',
    resizeWidth: false
  })

  $('#favorite-courses').css('max-height', getFavHeight())

  // toggle display of favorite things
  var toggleFavDisplay = function() {
    var isVisible = ($('#favorite-courses').height() > 0)
    console.log('toggleFavDisplay ' + (isVisible ? 'hiding' : 'showing'))
    $('#fav-display-toggle').removeClass(isVisible ? 'fa-minus' : 'fa-plus').addClass(isVisible ? 'fa-plus' : 'fa-minus')

    // set favorite courses transition start point
    $('#favorite-courses').addClass('notransition'); // Disable transitions temporarily
    $('#favorite-courses').css('max-height', $('#favorite-courses').outerHeight()/$(window).outerHeight()*100 + 'vh')
    $('#favorite-courses')[0].offsetHeight; // Trigger a reflow, flushing the CSS changes
    $('#favorite-courses').removeClass('notransition'); // Re-enable transitions

    var favHeight = $('#favs').height()/$(window).height()*100
    if (favHeight > 30) favHeight = 30

    $('#favorite-courses').css('max-height', (isVisible ? '0vh' : favHeight + 'vh'))

    $('#favorite-courses').one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend',
      function(e) {
        // set favorite courses end point
        $('#favorite-courses').addClass('notransition'); // Disable transitions temporarily
        if (!isVisible) $('#favorite-courses').css('max-height', '30vh')
        $('#favorite-courses')[0].offsetHeight; // Trigger a reflow, flushing the CSS changes
        $('#favorite-courses').removeClass('notransition'); // Re-enable transitions

        $('#favorite-courses').off('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend')
    })

    return false
  }
  $('#fav-display-toggle').click(toggleFavDisplay)
  /*$('#favorite-header').click(toggleFavDisplay)*/

  // handle click of search toggle
  var toggleSearchDisplay = function() {
    var isVisible = ($('#search-results').height() > 0)
    console.log('toggleSearchDisplay ' + (isVisible ? 'hiding' : 'showing'))
    $('#search-display-toggle').removeClass(isVisible ? 'fa-minus' : 'fa-plus').addClass(isVisible ? 'fa-plus' : 'fa-minus')

    var fullHeight = ($('#search-pane').height()
                    - $('#search-header').height()
                    - $('#favorite-header').height()
                    - $('#search-form').height())

    var favHidden = ($('#favorite-courses').height() === 0)
    var changeFav = ($('#favorite-courses').height() === fullHeight)
    console.log('changeFav ' + changeFav)

    // set favorite courses and search results transition start point
    $('#favorite-courses, #search-results').addClass('notransition'); // Disable transitions temporarily
    if (changeFav) $('#favorite-courses').css('max-height', $('#favorite-courses').outerHeight()/$(window).outerHeight()*100 + 'vh')
    $('#search-results').css('max-height', $('#search-results').outerHeight()/$(window).outerHeight()*100 + 'vh')
    if (changeFav) $('#favorite-courses')[0].offsetHeight; // Trigger a reflow, flushing the CSS changes
    $('#search-results')[0].offsetHeight;
    $('#favorite-courses, #search-results').removeClass('notransition'); // Re-enable transitions

    var favHeight = $('#favs').height()
    if (favHeight > fullHeight) favHeight = fullHeight

    newFavHeight = $('#favorite-courses').height()/$(window).height()*100
    if (changeFav) newFavHeight = 30

    // set search results transition start point
    if (changeFav) $('#favorite-courses').css('max-height', isVisible ? (favHeight/$(window).outerHeight()*100) + 'vh' : '30vh')
    $('#search-results').css('max-height', isVisible ? '0vh' : (fullHeight/$(window).outerHeight()*100 - newFavHeight) + 'vh')

    $('#search-results').one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend',
      function(e) {
        console.log('callback')
        // set favorite courses and search results transition end point
        $('#favorite-courses, #search-results').addClass('notransition'); // Disable transitions temporarily
        if (isVisible && changeFav) $('#favorite-courses').css('max-height', '')
        if (!isVisible) $('#search-results').css('max-height', '')
        if (changeFav) $('#favorite-courses')[0].offsetHeight; // Trigger a reflow, flushing the CSS changes
        $('#search-results')[0].offsetHeight;
        $('#favorite-courses, #search-results').removeClass('notransition'); // Re-enable transitions

        $('#search-results').off('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend')
    })
  }
  $('#search-display-toggle').click(toggleSearchDisplay)
  /*$('#search-header').click(toggleSearchDisplay)*/

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

    init_load()
  })
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
  $('#disp-instructors-toggle'  ).click(function() {return section_toggle('disp', 'instructors')})
  //$('#disp-instructors-header'  ).click(function() {return section_toggle('disp', 'instructors')})
  $('#disp-description-toggle'  ).click(function() {return section_toggle('disp', 'description')})
  //$('#disp-description-header'  ).click(function() {return section_toggle('disp', 'description')})
  $('#disp-readings-toggle'     ).click(function() {return section_toggle('disp', 'readings')})
  //$('#disp-readings-header'     ).click(function() {return section_toggle('disp', 'readings')})
  $('#disp-assignments-toggle'  ).click(function() {return section_toggle('disp', 'assignments')})
  //$('#disp-assignments-header'  ).click(function() {return section_toggle('disp', 'assignments')})
  $('#disp-grading-toggle'      ).click(function() {return section_toggle('disp', 'grading')})
  //$('#disp-grading-header'      ).click(function() {return section_toggle('disp', 'grading')})
  $('#disp-prerequisites-toggle').click(function() {return section_toggle('disp', 'prerequisites')})
  //$('#disp-prerequisites-header').click(function() {return section_toggle('disp', 'prerequisites')})
  $('#disp-equivalent-toggle'   ).click(function() {return section_toggle('disp', 'equivalent')})
  //$('#disp-equivalent-header'   ).click(function() {return section_toggle('disp', 'equivalent')})
  $('#disp-other-toggle'        ).click(function() {return section_toggle('disp', 'other')})
  //$('#disp-other-header'        ).click(function() {return section_toggle('disp', 'other')})
  $('#disp-reserved-toggle'     ).click(function() {return section_toggle('disp', 'reserved')})
  //$('#disp-reserved-header'     ).click(function() {return section_toggle('disp', 'reserved')})
  $('#disp-classes-toggle'      ).click(function() {return section_toggle('disp', 'classes')})
  //$('#disp-classes-header'      ).click(function() {return section_toggle('disp', 'classes')})
}

// to initialize evals toggling
var init_evals = function() {
  $('#evals-semesters-toggle').click(function() {return section_toggle('evals', 'semesters')})
  //$('#evals-semesters-header').click(function() {return section_toggle('evals', 'semesters')})
  $('#evals-numeric-toggle'  ).click(function() {return section_toggle('evals', 'numeric')})
  //$('#evals-numeric-header'  ).click(function() {return section_toggle('evals', 'numeric')})
  $('#evals-comments-toggle' ).click(function() {return section_toggle('evals', 'comments')})
  //$('#evals-comments-header' ).click(function() {return section_toggle('evals', 'comments')})
}

// to initialize suggest display
var init_suggest = function() {
  suggest_load()
  $('#suggest-toggle').click(toggleSuggest)
  $('#suggest-allcourses-toggle'   ).click(function() {return section_toggle('suggest', 'allcourses')})
  //$('#suggest-allcourses-header'   ).click(function() {return section_toggle('suggest', 'allcourses')})
  $('#suggest-distributions-toggle').click(function() {return section_toggle('suggest', 'distributions')})
  //$('#suggest-distributions-header').click(function() {return section_toggle('suggest', 'distributions')})
  $('#suggest-pdfoptions-toggle'   ).click(function() {return section_toggle('suggest', 'pdfoptions')})
  //$('#suggest-pdfoptions-header'   ).click(function() {return section_toggle('suggest', 'pdfoptions')})
  $('#suggest-departments-toggle'  ).click(function() {return section_toggle('suggest', 'departments')})
  //$('#suggest-departments-header'  ).click(function() {return section_toggle('suggest', 'departments')})
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

  return false;
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
