
var detectClash = function (favoriteCourses, courses, excludeClashingCourses) {
  // check exclude boolean, retu
  // run initial path search for favoriteCourses

  for (var courseIndex in courses) {
    var thisCourse = courses[courseIndex]

    if (thisCourse.title === 'American Economic History') {
      thisCourse.clash = {
        clash: true,
        with: 'Math 202'
      }
    }

    courses[courseIndex] = thisCourse
  }

  return 2017
}

module.exports.detectClash = detectClash
