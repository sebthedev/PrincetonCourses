// returns a string of HTML for results in the search pane for the given course
function newResultEntry(course) {
  return ('<li class="list-group-item search-result"><div class="flex-container-row"><div class="flex-item-stretch truncate"><strong>'
   + getListings(course)
   + '</strong></div><div class="flex-item-rigid"><i class="fa fa-heart fav-icon"></i> <span class="badge"'
   + ((course.evaluations.hasOwnProperty('scores') &&
       course.evaluations.scores.hasOwnProperty('Overall Quality of the Course'))
     ? (' style="background-color: '
        + colorAt(course.evaluations.scores['Overall Quality of the Course'])
        + '">'
        + course.evaluations.scores['Overall Quality of the Course'].toFixed(2))
     : '>N/A')
   + '</span></div></div><div class="truncate">'
   + course.title
   + '</div></li>')
}

// returns a string of HTML for results in the search pane for the given course
// basically the same as the one above except the heart icon.
function newFavEntry(course) {
  return ('<li class="list-group-item search-result"><div class="flex-container-row"><div class="flex-item-stretch truncate"><strong>'
   + getListings(course)
   + '</strong></div><div class="flex-item-rigid"><i class="fa fa-heart unfav-icon"></i> <span class="badge"'
   + ((course.evaluations.hasOwnProperty('scores') &&
       course.evaluations.scores.hasOwnProperty('Overall Quality of the Course'))
     ? (' style="background-color: '
        + colorAt(course.evaluations.scores['Overall Quality of the Course'])
        + '">'
        + course.evaluations.scores['Overall Quality of the Course'].toFixed(2))
     : '>N/A')
   + '</span></div></div><div class="truncate">'
   + course.title
   + '</div></li>')
}


function newInstructorCourseEntry(course) {
  return ('<li class="prof-course"><div class="flex-container-row"><div class="flex-item-stretch truncate"><strong>'
   + getListings(course)
   + ' ' + '(' + course.semester.name + ')'
   + '</strong></div><div class="flex-item-rigid"> <span class="badge"'
   + ((course.evaluations.hasOwnProperty('scores') &&
       course.evaluations.scores.hasOwnProperty('Overall Quality of the Course'))
     ? (' style="background-color: '
        + colorAt(course.evaluations.scores['Overall Quality of the Course'])
        + '">'
        + course.evaluations.scores['Overall Quality of the Course'].toFixed(2))
     : '>N/A')
   + '</span></div></div><div class="truncate">'
   + course.title
   + '</div></li>')
}

/* MEL: trying something, in construction...
function newDOMResult(course, favlist) {
  var isFav = false
  for (var courseIndex in courses) {
    if (courses[courseIndex]["_id"] === course["_id"]) {
      isFav = true
      break
    }
  }

  var li0 = document.createElement('li')
  li0.setAttribute('class', 'list-group-item search-result')

  var div0 = document.createElement('div')
  div0.setAttribute('class', 'flex-container-row')

  var div1 = document.createElement('div')
  div1.setAttribute('class', 'flex-item-stretch truncate')

  var strong0 = document.createElement('strong')
  strong0.appendChild(document.createTextNode(getListings(course)))
  div1.appendChild(strong0)

  var div2 = document.createElement('div')
  div2.setAttribute('class', 'flex-item-rigid')

  var i0 = document.createElement('i')
  i0.setAttribute('class', 'fa fa-heart unfav-icon')

}*/

// returns a string of the course listings of the given course
function getListings(course) {
  listings = course.department + course.catalogNumber
  for (var listing in course.crosslistings) {
    listings += '/' + course.crosslistings[listing].department
                    + course.crosslistings[listing].catalogNumber
  }

  return listings
}

// returns as a string a color at the given score
function colorAt(score) {
  if (score > 4.5)
    return '#2e7d32' // deeper green
  else if (score > 4.0)
    return '#4caf50' // brighter green
  else if (score > 3.5)
    return '#8bc34a' // lighter green
  else if (score > 3.0)
    return '#c6cf37' // olive
  else if (score > 2.5)
    return '#ffca28' // yellow
  else if (score > 2.0)
    return '#ef9100' // orange
  else if (score > 1.5)
    return '#d9534f' // brighter red
  else
    return '#bf360c' // deeper red
}
