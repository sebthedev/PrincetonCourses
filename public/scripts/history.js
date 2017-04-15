

// Handle displaying a course after pushing the back/forward button in the browser
window.onpopstate = function (event) {
  console.log(window.history)
  console.log(event)
  if (event.state && event.state.courseID) {
    displayCourseDetails(event.state.courseID)
  }
  if (event.state && event.state.searchQuery) {
    console.log('i made it')
    var parameters = parseSearchParameters(event.state.searchQuery)

    // perform search
    searchForCourses(parameters.search, parameters.semester, parameters.sort)
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
  var state = {}
  var URL = '/'
  if (courseId) {state.courseId = courseId; URL += 'course/' + courseId}
  if (queryURL) {state.searchQuery = queryURL; URL += queryURL}
  window.history.replaceState({courseId: courseId, searchQuery: queryURL}, null, )
}

// handles storing history on search
function history_search(queryURL) {
  delay(function() {
    var course = '/'
    if (document.courseId) course = '/course/' + document.courseId
    window.history.pushState({searchQuery: queryURL}, queryURL, course + queryURL)
    console.log('saved!')
  }, 2000)
}

// handles storing history on display
function history_display(courseId) {
  window.history.pushState({courseID: courseId}, courseId, '/course/' + courseId + getSearchQueryURL())
}

// to debounce search history
var delay = (function(){
  var timer;
  var lastCallBack;
  return function(callback, ms){
    if (ms === 0) {
      clearTimeout(timer);
      callback();
    }
    lastCallBack = callback
    clearTimeout(timer);
    timer = setTimeout(callback, ms);
 };
})();
