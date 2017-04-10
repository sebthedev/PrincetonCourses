//convert time to military time 
var parseMilitaryTime = function(time) {
  parsedTime = time.split(" ")
  parsedTime[0] = parsedTime[0].replace(':', '')
  mTime = parseInt(parsedTime[0])
  if (parsedTime[1] == "PM" && parsedTime[0].substring(0,2) != "12") {
    mTime += 1200
  }
  return mTime
}

//check whether two given timeframes have no overlap by using military time
//if clash, return true
var detectTimeClash = function (startTime1, endTime1, startTime2, endTime2) {
  if (startTime1 == null || endTime1 == null || 
    startTime2 == null || endTime2 == null) {
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

  for (var i = 0; i < section1.schedule.meetings.length; i++) {
    for (var j = 0; j < section2.schedule.meetings.length; j++) {

      days1 = section1.schedule.meetings[i].days
      days2 = section2.schedule.meetings[j].days
      //replace Th with Z to help with substring find
      if (days1 != null && days2 != null) {
        for (var k = 0; k < days1.length; k++) {
          for (var l = 0; l < days2.length; l++) {
            if (days1[k] == days2[l]) {
              return detectTimeClash(section1.schedule.meetings[i].start_time, 
                section1.schedule.meetings[i].end_time, section2.schedule.meetings[j].start_time, 
                section2.schedule.meetings[j].end_time)
            }
          }
        }
      }
    }
  }
  return false
} 

var checkedAll = function(sectionIndex, maxLength) {
	for (var i = 0; i < sectionIndex.length; i++) {
		if (sectionIndex[i] != maxLength[i] - 1)
			return false
	}

	return true
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

  //return all if excludeClashingCourses is false
  if (!excludeClashingCourses)
    return courses

  //if no courses are favorited, or only one is no clashes can exist
  if (favoriteCourses.length <= 1) 
    return courses

  //since favorite courses exist, do initial clash detection within them
  //WARNING: THIS HINGES ON THE SECTIONS BEING ORDERED BY SECTION TYPE

  //populate all the sections of all the favorite courses
  var favCourseSectionsAll = [] //holds all the sections
  var favCourseSectionsInc = [] //holds whether a section can exist in a non-clash schedule
  var maxLength = [] //lengths of nested arrays in favCourseSectionsAll
  var sectionIndex = [] //index to be used when looking at possible schedules
  
  for (var currentCourse = 0; currentCourse < favoriteCourses.length; currentCourse++) {
    //each course has new, independent sections
    var prevSectionType = ""
    var courseSectionsAll = []
    var courseSectionsInc = []
    var maxLengthIndex = 0

    var favCourse = favoriteCourses[currentCourse]
    for (var currentClass = 0; currentClass < favCourse.classes.length; currentClass++) {

      var currentSection = favCourse.classes[currentClass]
      if (prevSectionType != "") {
        //new section type within a course, push previous information into arrays
        if (prevSectionType != String(currentSection.section).charAt(0)) {
          favCourseSectionsAll.push(courseSectionsAll)
          courseSectionsAll = []    
          favCourseSectionsInc.push(courseSectionsInc)
          courseSectionsInc = []    
          maxLength.push(maxLengthIndex)
          maxLengthIndex = 0
          sectionIndex.push(0)
        }
      }
      courseSectionsAll.push(currentSection)
      courseSectionsInc.push(false)
      prevSectionType = String(currentSection.section).charAt(0)
      maxLengthIndex++
    }

    //all sections seen within course, push information into arrays 
    if (courseSectionsAll.length > 0) {
      favCourseSectionsAll.push(courseSectionsAll)
      favCourseSectionsInc.push(courseSectionsInc)
      maxLength.push(maxLengthIndex)
      maxLengthIndex = 0
      sectionIndex.push(0)
    }    
  }
  

  //if no more than 1 section within all favorite courses (odd but technically possible) return all courses, no clashes
  if (sectionIndex.length == 0)
  	return courses

  var done = false
  var i = 1
  //now check for all possible schedules to include only possible sections
  //note that if sectionIndex[0] >= maxLengthIndex[0] all possibilities have been checked and the algorithm should terminate
  //while (!checkedAll(sectionIndex, maxLength)  && !runBack) {
  while (!done) {
    while (i < sectionIndex.length) {
      for (var j = 0; j < i; j++) {
        if (detectSectionClash(favCourseSectionsAll[j][sectionIndex[j]], favCourseSectionsAll[i][sectionIndex[i]])) {
          sectionIndex[i]++
          while (sectionIndex[i] >= maxLength[i]) {
            if (i <= 0) {
              sectionIndex[0] = 0
              done = true
              break
            }
            sectionIndex[i] = 0
            i--
            sectionIndex[i]++
          }
          j = -1
        }
        if (done)
          break
      }
      if (done)
        break
      i++
    }
    if (done)
        break

    for (var j = 0; j < sectionIndex.length; j++) {
      favCourseSectionsInc[j][sectionIndex[j]] = true
    }

    //update counters
    i--
    sectionIndex[i]++
    while (sectionIndex[i] >= maxLength[i]) {
      if (i <= 0) {
        sectionIndex[0] = 0
        done = true
        break
      }
      sectionIndex[i] = 0
      i--
      sectionIndex[i]++
    }
  }


  //favCourseSectionsInc has been updated and can now be used to populate subgraph
  var incFavCourseSections = []
  for (var i = 0; i < favCourseSectionsAll.length; i++) {
  	var incSections = []
  	for (var j = 0; j < favCourseSectionsAll[i].length; j++) {
  		if (favCourseSectionsInc[i][j])
  			incSections.push(favCourseSectionsAll[i][j])
  	}
  	incFavCourseSections.push(incSections)
  }


  //now that the original subgraph has been made, run clash on all courses from search results
  for (var courseIndex = 0; courseIndex < courses.length; courseIndex++) {

    var thisCourse = courses[courseIndex]

    //each course has new, independent sections
    var currentCourseSectionsAll = []
    var currentMaxLength = []
    var currentSectionIndex = []

    var prevSectionType = ""
    var courseSectionsAll = []
    var maxLengthIndex = 0
    var courseSections = []

    for (var currentClass = 0; currentClass < thisCourse.classes.length; currentClass++) {
      var currentSection = thisCourse.classes[currentClass]
      if (prevSectionType != "" && currentSection.section != null) {
        //new section type within a course, push previous information into arrays
        if (prevSectionType != String(currentSection.section).charAt(0)) {
          currentCourseSectionsAll.push(courseSections)
          courseSections = []       
          currentMaxLength.push(maxLengthIndex)
          maxLengthIndex = 0
          currentSectionIndex.push(0)
        }
      }
      courseSections.push(currentSection)
      prevSectionType = currentSection.section.charAt(0)
      maxLengthIndex++
    }

    //all sections seen within course, push information into arrays 
    if (courseSections != null) {
      currentCourseSectionsAll.push(courseSections)
      currentMaxLength.push(maxLengthIndex)
      currentSectionIndex.push(0)
    }

    //combine information to run clash
    currentCourseSectionsAll = incFavCourseSections.concat(currentCourseSectionsAll)
    currentMaxLength = maxLength.concat(currentMaxLength)
    currentSectionIndex = sectionIndex.concat(currentSectionIndex)

  //run a modified clash
  var done = false
  var possibleScheduleFound = false
  var i = 1
	//now check for all possible schedules to include only possible sections
	//note that if sectionIndex[0] >= maxLengthIndex[0] all possibilities have been checked and the algorithm should terminate
	//while (!checkedAll(sectionIndex, maxLength)  && !runBack) {
  while (!possibleScheduleFound) {
    while (i < currentSectionIndex.length) {
      for (var j = 0; j < i; j++) {
        if (detectSectionClash(currentCourseSectionsAll[j][currentSectionIndex[j]], currentCourseSectionsAll[i][currentSectionIndex[i]])) {
          currentSectionIndex[i]++
          while (currentSectionIndex[i] >= currentMaxLength[i]) {
            if (i <= 0) {
              done = true
              break
            }
            currentSectionIndex[i] = 0
            i--
            currentSectionIndex[i]++
          }
          j = -1
        }
        if (done)
          break
      }
    if (done)
      break
    i++
  }
  if (done)
    break
  
  possibleScheduleFound = true
  }

  thisCourse.clash = (!possibleScheduleFound)
  courses[courseIndex] = thisCourse
}

  //it's all done OMG!
  return courses
}
module.exports.detectCourseClash = detectCourseClash