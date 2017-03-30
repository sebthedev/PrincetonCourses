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
  if (startTime1 == null || endTime1 == null || startTime2 == null || endTime2 == null) {
    return false
  }
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

var detectSectionClash = function(section1, section2) {
  if (section1 == null || section2 == null) {
    return false
  }
  //replace Th with Z to help with substring find
  days1 = section1days.replace("Th", "Z")
  days2 = section2days.replace("Th", "Z")
  if (days1 != null && days2 != null) {
    for (var i = 0; i < days1.length; i++) {
      if (days2.includes(days1.charAt(i))) {
        return detectTimeClash(section1.starttime, section1.endtime, section2.starttime, section2.endtime)
      }
    }
  }
  return false
} 


/* Seb, if you're reading this, I want you to know, I decided to not use a graph 
for this because we would have to implement all the aspects of graphs here 
(data structures and algorithms) and it's not more time efficient than doing the 
same work with nested arrays. This is because the possible no-clash paths are not 
something that can be passed on efficiently once the original analysis for 
favoriteCourses happens, so clash detection would still have to be done for everything 
due to the nature of the graphs that would be passed on.
Thus, I'm doing nested arrays with some additional arrays to hold indices of the sub-
arrays. (I know this is complicated, but that's what happens with a problem that's
exponential in nature.) Hopefully, this will all work, and fast enough that it doesn't
have to make a lot of sense. */

var detectCourseClash = function (favoriteCourses, courses, excludeClashingCourses) {
  
  //if no courses are favorited, no clashes can exist
  if (favoriteCourses == []) {
    return courses
  }


  //since favorite courses exist, do initial clash detection within them
  //WARNING: THIS HINGES ON THE SECTIONS BEING ORDERED BY SECTION TYPE

  //populate all the sections of all the favorite courses

  var favCourseSectionsAll = [] //holds all the sections
  var favCourseSectionsInc = [] //holds whether a section can exist in a non-clash schedule
  var maxLength = [] //lengths of nested arrays in favCourseSectionsAll
  var sectionIndex = [] //index to be used when looking at possible schedules
  
  for (var course in favoriteCourses) {
    //each course has new, independent sections
    var prevSectionType = null
    var courseSectionsAll = []
    var courseSectionsInc = []
    var maxLengthIndex = 0
    var sectionIndex = []

    for (var section in course.classes) {
      if (prevSectionType != null && section.section != null) {
        //new section type within a course, push previous information into arrays
        if (prevSectionType != section.section.charAt(0)) {
          favCourseSectionsAll.push(courseSections)
          courseSectionsAll = []    
          favCourseSectionsInc.push(courseSectionsInc)
          courseSectionsInc = []    
          maxLength.push(maxLengthIndex)
          maxLengthIndex = 0
          sectionIndex.push(0)

        }
      }
      courseSectionsAll.push(section)
      courseSectionsInc.push(false)
      prevSectionType = section.section.charAt(0)
      maxLengthIndex++
    }

    //all sections seen within course, push information into arrays 
    if (courseSectionsAll != null) {
      favCourseSectionsAll.push(courseSectionsAll)
      favCourseSectionsInc.push(courseSectionsInc)
      maxLength.push(maxLengthIndex)
      sectionIndex.push(0)
    }
  }



  //now check for all possible schedules to include only possible sections

  for (var i = 0; i < favCourseSectionsAll.length; i++) {
    for (var j = i-1; j >= 0; j--) {
      sectionIndex[i] = 0
      sectionCurrent = favCourseSectionsAll[i][sectionIndex[i]]
      sectionPrevious = favCourseSectionsAll[j][sectionIndex[j]]
      while (detectSectionClash(sectionCurrent, sectionPrevious)) {
        sectionIndex[i]++ 
      }
    }
  }








  /* Extra code from when I was foolish enough to include hash tables. (Accessing in
  a nested fashion became a nightmare.)
  var favCoursesCourses = []
  for (course in favoriteCourses) {
    var courseSectionsLists = {}
    for (var section in course.classes) {
      var sectionName = course.classes[classindex].section
      if (courseSectionsLists[sectionName.charAt(0)] == null) {
        courseSectionsLists[sectionName.charAt[0]] = []       
      }
      courseSectionsLists[sectionName.charAt[0]].push(section)
    }
    favCoursesCourses.push(courseSectionsLists)
  }
  */

  //now run courseclash to see if any sections can be excluded due to unnegotiable clash with favorites


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
