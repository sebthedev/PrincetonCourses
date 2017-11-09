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
  searchFromURL(parameters.search, parameters.semester, parameters.sort, parameters.filterClashes, search_noswipe)

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
  // make fav section resizable
  $('#favorite-courses').resizable({
    handleSelector: '#search-header',
    resizeWidth: false
  })

  $('#favorite-courses').css('max-height', '30vh')

  // toggle display of favorite things
  var toggleFavDisplay = function() {
    var isVisible = ($('#favorite-courses').height() > 0)
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

  // toggle display of advanced search
  var toggleAdvancedDisplay = function() {
    var isVisible = $('#advanced-body').is(':visible')

    $('#advanced-title').html((isVisible ? 'More Options' : 'Hide') + ' <i class="fa ' + (isVisible ? 'fa-caret-down' : 'fa-caret-up') + '"></i>')

    $('#advanced-body').slideToggle()
  }
  $('#advanced-title').click(toggleAdvancedDisplay)
}

// to initialize searching function
var init_search = function() {
  // restore sort used
  var savedSort = localStorage.getItem("sort");
  $('#sort').selectpicker('val', ((savedSort !== undefined && savedSort !== null) ? savedSort : "commonName"))

  // Every time a key is pressed inside the #searchbox, search
  $('#searchbox').on('input', searchFromBox)
  $('#semester, #sort, #advanced-filter-clashes').change(searchFromBox)

  // Allow clicking the "Search" keyboard button on mobile
  if (document.isMobile) {
    $('#searchbox').keypress(function (event) {
      if (event.keyCode === 13) {
        $(this).blur()
      }
    })
  }

  // load the semesters for the dropdown
  $('#semester').children().remove()
  console.log('releaseVersion:', releaseVersion)
  var localReleaseVersion = releaseVersion || 'v1'
  $.get('/api/semesters?v=' + localReleaseVersion, function (semesters) {
    for (var semesterIndex in semesters) {
      var thisSemester = semesters[semesterIndex]
      var option = $(document.createElement('option')).attr('value', thisSemester._id).text(thisSemester.name)
      $('#semester').append(option)
    }

    // re-render drop down
    $('#semester').selectpicker('refresh');

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

// to initialize display pane
var init_display = function() {
  // nothing here
}

// to initialize evals pane
var init_evals = function() {
  // nothing here
}

// to initialize suggest display
var init_suggest = function() {
  suggest_load()
  $('#suggest-toggle').click(toggleSuggest)
}

// to initialize updates popup
var init_updates = function() {
  var updateMessage = 'Princeton Courses is now updated with courses for Spring 2018. Happy course selection!'
  var updateNo = 3 //  BENSU: increment this number for new updates
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
