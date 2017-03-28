/* MEL: IDEAS IDEAS IDEAS

  I don't really know what's happening in the backend so I'll approach this
  interface from the point of view of the frontend. This is very much a draft
  attempt at reorganizing the database --- edits and comments welcome!

  AIMS (-->THIS IS PROBABLY THE MOST IMPORTANT SECTION OF MY RAMBLE<--) from a frontend perspective

    The general idea is to organize courses based on their primary listing. In
    an abstract sense, a course (as an object) is not inherently linked to a certain semester.
    The primary listing (dept + num) is a unique way to identify such courses.
    So, (in the stuff below)
    -- a courseSchema course should be independent of the semesters it is offered.
    -- an offeringSchema course is specific to a certain semester it is offered.

    SEARCH should not be restricted to a semester. Information on search results in the
    search pane should be relevant to the most recent offering of that course. We can add
    targetting/filtering certain semesters as a feature later.

    DISPLAY: ability to switch between data from different semesters of a course
    would be nice. This applies not only to evaluations but also all other
    semester-specific information.

    INSTRUCTORS: should be linked to a course but only in the semesters the instructor
    taught. This allows for some aggregating/averaging of evaluation scores for
    instructors. There should also be a mechanism for possibly retrieving the original
    semester-independent course details from each semester-bound course here, so that
    (for example), a user can favorite the course, or display it.

    USER: should only be able to save semester-independent courses. What would it mean
    to favorite the same course in different semesters?!?

  ----

  Again, not sure how this works out in the backend but I imagine using it on
  the front end as follows: (This stuff probably shaky)

  SEARCH
    a courseSchema course object returned for searches, with an unpopulated list of
    all offerings of the course, and a populated offeringSchema course object of the
    most recent offering of the course.

    The most recent offering has the added benefit of indicating if a course will
    be offered in the upcoming term.

    -- search result display will show info from the most recent offering.
    -- clicking the search result to display the info will require populating
         all the offerings with offeringSchema course objects, so that they can be
         displayed

    regarding searching for specific semesters, could backend manage targetting/filtering
    courses offered in certain semesters?

  DISPLAY
    Some sort of button array or slider or something from the front end to selectively
    display info from a certain semester. (This way all data is still accessible.)

    Maybe display as much past evaluation data as can be nicely crammed onto the screen.

  INSTRUCTORS
    instructor objects should be linked to the relevant offeringSchema of the semester
    they taught. Upon request for an instructor, I imagine populating a bunch of
    offeringSchema course objects whose 'course' entry is populated like a
    courseSchema course object for the search bar. Bit of a mouthful.

  USERS
    favorites should be courseSchema course id's
*/

// I imagine this being used for the search results / favorites
var courseSchema = new mongoose.Schema({
  _id: Number,
  department: {type: String, uppercase: true, trim: true},
  catalogNumber: {type: String, trim: true, uppercase: true},
  offerings: [{type: Number, ref: 'Offering'}] // link to all offerings (unpopulated in search, populated upon display?)
  recent: {type: Number, ref: 'Offering'} // link to most recent offering (always populated?)
})

// I imagine this being used for display of course data
var offeringSchema = new mongoose.Schema({
  _id: Number,
  courseID: String,
  course: {type: Number, ref: 'Course'} // probably unpopulated
  title: {type: String, trim: true},
  semester: {type: Number, ref: 'Semester'},
  description: {type: String, trim: true},
  classes: [], // might want something well-defined here?
  crosslistings: [{department: {type: String, uppercase: true, trim: true}, // these vary across sems (e.g. psy255)
                   catalogNumber: {type: String, trim: true, uppercase: true}}],
  evaluations: {scores: {}, studentComments: [{type: String, trim: true}]}, // might want to add something for up/downvotes
  distribution: {type: String, uppercase: true, trim: true},
  pdf: {permitted: Boolean, required: Boolean},
  audit: Boolean,
  assignments: [String],
  grading: Array, // might want something more well defined
  prerequisites: {type: String, trim: true},
  equivalentcourses: {type: String, trim: true},
  otherinformation: {type: String, trim: true},
  otherrequirements: {type: String, trim: true},
  website: {type: String, trim: true},
  track: {type: String, trim: true, uppercase: true} // might be better in the courseSchema?
})
