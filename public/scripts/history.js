

// Handle displaying a course after pushing the back/forward button in the browser
//  -- courseId = '' ==> display initial screen
window.onpopstate = function (event) {
  // record history entry
  document.history_pos -= 1;

  // load content as required
  var noswipe = false // to monitor swiping
  if (event.state && event.state.hasOwnProperty('courseId')) {
    displayCourseDetails(event.state.courseId)
    noswipe = true
  } else if (event.state && !event.state.hasOwnProperty('courseId')) {
    // skip search-only history if in desktop
    if (!document.isMobile) window.history.back()
  }

  if (event.state && event.state.hasOwnProperty('searchQuery')) {
    var parameters = parseSearchParameters(event.state.searchQuery)
    // perform search
    searchForCourses(parameters.search, parameters.semester, parameters.sort, noswipe)
  }


  // handle mobile back button
  if (document.history_pos === 0) {
    $('#menu-brand-abbr').css('display', '')
    $('#menu-back').css('display', 'none')
  } else {
    $('#menu-brand-abbr').css('display', 'none')
    $('#menu-back').css('display', '')
  }
}

// Parse the URL to check for whether the app should be showing a course and displaying any search terms
var parseSearchParameters = function(queryURL) {
  // Parse search terms
  var unparsedParameters = queryURL.replace('?', '').split('&')
  var parameters = {}
  for (var parametersIndex in unparsedParameters) {
    var keyValue = unparsedParameters[parametersIndex].split('=')
    if (keyValue.length === 2) {
      parameters[keyValue[0]] = decodeURIComponent(keyValue[1])
    }
  }

  return parameters
}

// handles storing history on page load
function history_init(courseId, queryURL) {
  // record start of history
  document.history_pos = 0

  // correct first history entry
  var state = {}
  var stateURL = '/'
  state.courseId = courseId
  if (courseId !== '') stateURL += 'course/' + courseId
  state.searchQuery = queryURL
  stateURL += queryURL

  window.history.replaceState(state, null, stateURL)
}

// handles storing history on search
function history_search(queryURL) {
  // cancel if empty
  if (parseSearchParameters(queryURL).search === '') {
    delay(undefined, -1)
    return
  }

  delay(function() {
    // record history entry
    document.history_pos += 1;

    // put search into history
    var course = '/'
    if (document.courseId) course = '/course/' + document.courseId
    window.history.pushState({searchQuery: queryURL}, queryURL, course + queryURL)

    // handle mobile back button
    $('#menu-brand-abbr').css('display', 'none')
    $('#menu-back').css('display', '')
  }, 2000)
}

// handles storing history on display
function history_display(courseId) {
  // record history entry
  document.history_pos += 1;

  // flush search history
  delay(undefined, 0)

  var queryURL = getSearchQueryURL()

  // put course into history
  window.history.pushState({courseId: courseId, searchQuery: queryURL}, courseId, '/course/' + courseId + queryURL)

  // handle mobile back button
  $('#menu-brand-abbr').css('display', 'none')
  $('#menu-back').css('display', '')
}

// to debounce search history
var delay = (function(){
  var timer;
  var lastCallBack;
  return function(callback, ms){
    // flush the callback if ms is zero
    if (ms === 0) {
      clearTimeout(timer);
      if (lastCallBack !== undefined) lastCallBack();
      lastCallBack = undefined;
      return;
    }

    // cancel callback if ms is -1
    if (ms === -1) {
      clearTimeout(timer);
      lastCallBack = undefined;
      return;
    }

    // set timer
    lastCallBack = callback
    clearTimeout(timer);
    timer = setTimeout(function() {
      lastCallBack = undefined;
      callback();
    }, ms);
 };
})();
