//convert time to military time 
var parseMilitaryTime = function(time) {
  parsedTime = time.split(" ")
  parsedTime[0] = parsedTime[0].replace(':', '')
  mTime = parseInt(parsedTime[0])
  if (parsedTime[1] == "pm") {
    mTime += 1200
  }

  return mTime
}

//check whether two given timeframes have no overlap by using military time
//if clash, return true
var detectTimeClash = function (startTime1, endTime1, startTime2, endTime2) {
  startTime1m = parseMilitaryTime(startTime1)
  endTime1m = parseMilitaryTime(endTime1)
  startTime2m = parseMilitaryTime(startTime2)
  endTime2m = parseMilitaryTime(endTime2)

  //start or end at same time
  if (startTime1m == startTime2m || endTime1m == endTime2m) {
    return true
  }

  //check if time2 begins before time1 ends
  if (startTime1m < startTime2m) {
    if (startTime2m < endTime1m) {
      return true
    }
  }

  //check if time1 begins before time2 ends
  else {
    if (startTime1m < endTime2m) {
      return true
    }
  }

  //classes do not overlap
  return false
}

var detectCourseClash = function (favoriteCourses, courses, excludeClashingCourses) {
  // check exclude boolean, 
  
  //if no courses are favorited, no clashes can exist
  if (favoriteCourses == []) {
    return courses
  }


  //since favorite courses exist, do initial clash detection within them

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


module.exports.detectCourseClash = detectCourseClash
