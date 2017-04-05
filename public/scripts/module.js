// returns as a string a color at the given score
function colorAt(score) {

  var val = (score / 5.0) - 0.20;
  var hue = Math.floor( 120 * val )

  if (hue < 0) { hue = 0; }
  if (hue == 96) { hue = 120; }
  return "hsl(" + hue + ", 100%, 35%)";

  // if (score > 4.5)
  //   return '#2e7d32' // deeper green
  // else if (score > 4.0)
  //   return '#4caf50' // brighter green
  // else if (score > 3.5)
  //   return '#8bc34a' // lighter green
  // else if (score > 3.0)
  //   return '#c6cf37' // olive
  // else if (score > 2.5)
  //   return '#ffca28' // yellow
  // else if (score > 2.0)
  //   return '#ef9100' // orange
  // else if (score > 1.5)
  //   return '#d9534f' // brighter red
  // else
  //   return '#bf360c' // deeper red
}

// returns a string of the main course listing of the given course
function mainListing(course) {
  return course.department + course.catalogNumber
}

// returns a string of the cross listings of the given course
function crossListings(course) {
  var listings = ''
  for (var listing in course.crosslistings) {
    listings += '/' + course.crosslistings[listing].department
                    + course.crosslistings[listing].catalogNumber
  }

  return listings
}
