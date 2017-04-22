// convert time to military time
let parseMilitaryTime = function (time) {
  let parsedTime = time.split(' ')
  parsedTime[0] = parsedTime[0].replace(':', '')
  let mTime = parseInt(parsedTime[0])
  if (parsedTime[1] === 'PM' && parsedTime[0].substring(0, 2) !== '12') {
    mTime += 1200
  }
  return mTime
}

// check whether two given timeframes have no overlap by using military time
// if clash, return true
let detectTimeClash = function (startTime1, endTime1, startTime2, endTime2) {
  if (startTime1 == null || endTime1 == null ||
    startTime2 == null || endTime2 == null) {
    return false
  }
  let startTime1m = parseMilitaryTime(startTime1)
  let endTime1m = parseMilitaryTime(endTime1)
  let startTime2m = parseMilitaryTime(startTime2)
  let endTime2m = parseMilitaryTime(endTime2)

  // start or end at same time
  if (startTime1m === startTime2m || endTime1m === endTime2m) {
    return true
  }

  // check if time2 begins before time1 ends
  if (startTime1m < startTime2m) {
    if (startTime2m < endTime1m) {
      return true
    }
  } else {
    // check if time1 begins before time2 ends
    if (startTime1m < endTime2m) {
      return true
    }
  }

  // classes do not overlap
  return false
}

let detectSectionClash = function (section1, section2) {
  if (section1 == null || section2 == null) {
    return false
  }

  for (let i = 0; i < section1.schedule.meetings.length; i++) {
    for (let j = 0; j < section2.schedule.meetings.length; j++) {
      let days1 = section1.schedule.meetings[i].days
      let days2 = section2.schedule.meetings[j].days
      // replace Th with Z to help with substring find
      if (days1 != null && days2 != null) {
        for (let k = 0; k < days1.length; k++) {
          for (let l = 0; l < days2.length; l++) {
            if (days1[k] === days2[l]) {
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

// For each of the courses in 'courses', determine whether there is any possible schedule for all of the favoriteCourses such that it is possible to take thisCourse. Return an array of courses with the clash boolean field set on each course.
let detectCourseClash = function (favoriteCourses, courses, semester) {
  // Validate inputs
  if (typeof (semester) === 'undefined') {
    return {
      status: 'semester must be a number',
      courses: courses
    }
  }

  // Check the number of favorite courses
  // If no courses are favorited then no clashes can exist
  if (favoriteCourses.length === 0) {
    // Set all of the courses' clash to false
    for (let courseIndex in courses) {
      courses[courseIndex].clash = false
    }

    // Return the courses array
    return {
      status: 'success',
      courses: courses
    }
  }

  // since favorite courses exist, do initial clash detection within them
  // WARNING: THIS HINGES ON THE SECTIONS BEING ORDERED BY SECTION TYPE

  // populate all the sections of all the favorite courses
  let favCourseSectionsAll = [] // holds all the sections
  let favCourseSectionsInc = [] // holds whether a section can exist in a non-clash schedule
  let maxLength = [] // lengths of nested arrays in favCourseSectionsAll
  let sectionIndex = [] // index to be used when looking at possible schedules
  let favoriteCourseIDs = []

  // for (let currentCourse = 0; currentCourse < favoriteCourses.length; currentCourse++) {
  for (let favoriteCourseIndex in favoriteCourses) {
    let thisFavoriteCourse = favoriteCourses[favoriteCourseIndex]

    // Ignore courses from other semesters
    if (thisFavoriteCourse.semester._id !== semester) {
      continue
    }

    // Append this courses' ID to favoriteCourseIDs
    favoriteCourseIDs.push(thisFavoriteCourse._id)

    // each course has new, independent sections
    let prevSectionType = ''
    let courseSectionsAll = []
    let courseSectionsInc = []
    let maxLengthIndex = 0

    for (let classIndex in thisFavoriteCourse.classes) {
      let thisClass = thisFavoriteCourse.classes[classIndex]
      if (prevSectionType !== '') {
        // new section type within a course, push previous information into arrays
        if (prevSectionType !== thisClass.section.charAt(0)) {
          favCourseSectionsAll.push(courseSectionsAll)
          courseSectionsAll = []
          favCourseSectionsInc.push(courseSectionsInc)
          courseSectionsInc = []
          maxLength.push(maxLengthIndex)
          maxLengthIndex = 0
          sectionIndex.push(0)
        }
      }
      courseSectionsAll.push(thisClass)
      courseSectionsInc.push(false)
      prevSectionType = thisClass.section.charAt(0)
      maxLengthIndex++
    }

    // all sections seen within course, push information into arrays
    if (courseSectionsAll.length > 0) {
      favCourseSectionsAll.push(courseSectionsAll)
      favCourseSectionsInc.push(courseSectionsInc)
      maxLength.push(maxLengthIndex)
      maxLengthIndex = 0
      sectionIndex.push(0)
    }
  }

  // if no more than 1 section within all favorite courses (odd but technically possible) return all courses, no clashes
  if (sectionIndex.length === 0) {
    // Set all of the courses' clash to false
    for (let courseIndex in courses) {
      courses[courseIndex].clash = false
    }
    return {
      status: 'success',
      courses: courses
    }
  }

  let done = false
  let i = 1
  // now check for all possible schedules to include only possible sections
  // note that if sectionIndex[0] >= maxLengthIndex[0] all possibilities have been checked and the algorithm should terminate
  while (!done) {
    while (i < sectionIndex.length) {
      for (let j = 0; j < i; j++) {
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
        if (done) {
          break
        }
      }
      if (done) { break }
      i++
    }
    if (done) {
      break
    }

    for (let j = 0; j < sectionIndex.length; j++) {
      favCourseSectionsInc[j][sectionIndex[j]] = true
    }

    // update counters
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

  // favCourseSectionsInc has been updated and can now be used to populate subgraph
  let incFavCourseSections = []
  for (let i = 0; i < favCourseSectionsAll.length; i++) {
    let incSections = []
    for (let j = 0; j < favCourseSectionsAll[i].length; j++) {
      if (favCourseSectionsInc[i][j]) {
        incSections.push(favCourseSectionsAll[i][j])
      }
    }
    incFavCourseSections.push(incSections)
  }

  // Check if there is no clash currently, if there is, return all courses, since clash will persist
  //update values in maxLength to account for dropped sections
  for (let i = 0; i < incFavCourseSections.length; i++) {
    if (incFavCourseSections[i].length <= 0) {
      return {
        status: 'favoritesClash',
        courses: courses
      }
    }
    maxLength[i] = incFavCourseSections[i].length
  }

  // now that the original subgraph has been made, run clash on all courses from search results
  for (let courseIndex = 0; courseIndex < courses.length; courseIndex++) {
    let thisCourse = courses[courseIndex]

    // If this course is in the favorites list then skip over it
    if (favoriteCourseIDs.includes(thisCourse._id)) {
      courses[courseIndex].clash = false
      continue
    }

    // each course has new, independent sections
    let currentCourseSectionsAll = []
    let currentMaxLength = []
    let currentSectionIndex = []

    let prevSectionType = ''
    let maxLengthIndex = 0
    let courseSections = []

    if (typeof (thisCourse.classes) !== 'undefined' && thisCourse.classes !== null) {
      thisCourse.classes.forEach(function (thisClass) {
        if (prevSectionType !== '' && thisClass.section != null) {
        // new section type within a course, push previous information into arrays
          if (prevSectionType !== thisClass.section.charAt(0)) {
            currentCourseSectionsAll.push(courseSections)
            courseSections = []
            currentMaxLength.push(maxLengthIndex)
            maxLengthIndex = 0
            currentSectionIndex.push(0)
          }
        }
        courseSections.push(thisClass)
        prevSectionType = thisClass.section.charAt(0)
        maxLengthIndex++
      })
    }

    // all sections seen within course, push information into arrays
    if (courseSections != null) {
      currentCourseSectionsAll.push(courseSections)
      currentMaxLength.push(maxLengthIndex)
      currentSectionIndex.push(0)
    }

    // combine information to run clash
    currentCourseSectionsAll = incFavCourseSections.concat(currentCourseSectionsAll)
    currentMaxLength = maxLength.concat(currentMaxLength)
    currentSectionIndex = sectionIndex.concat(currentSectionIndex)

    // run a modified clash
    let done = false
    let possibleScheduleFound = false
    let i = 1

    // now check for all possible schedules to include only possible sections
    // note that if sectionIndex[0] >= maxLengthIndex[0] all possibilities have been checked and the algorithm should terminate
    while (!possibleScheduleFound) {
      while (i < currentSectionIndex.length) {
        for (let j = 0; j < i; j++) {
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
          if (done) {
            break
          }
        }
        if (done) { break }
        i++
      }
      if (done) {
        break
      }

      possibleScheduleFound = true
    }
    courses[courseIndex].clash = (!possibleScheduleFound)
  }

  // Return the courses array with each course containing a new 'clash' property indicating whether the course clashes with any favorites
  return {
    status: 'success',
    courses: courses
  }
}

// Export the detectCourseClash method to clients
module.exports.detectCourseClash = detectCourseClash
   courses: courses
  }
}

// Export the detectCourseClash method to clients
module.exports.detectCourseClash = detectCourseClash
