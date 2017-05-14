# Importing Data
Princeton courses has a collection of scripts in the `importers` folder that fetch course information from the Registrar’s servers. These scripts may require updating as the Registrar modifies their systems. Each of these scripts should be run from the root of the repository with the command `node importers/SCRIPTNAME.js`.

## Script to Run Periodically
`importBasicCourseDetails.js` populates the database with the basic details of each course, instructor, and semester. This script uses the Office of Information Technology’s [course offerings web feed](https://webfeeds.princeton.edu/#feed,19). This script runs quickly (10 to 15 seconds) and should be run at regular intervals. The frequency of running the script will change throughout the year. During course enrollment period and add/drop periods, we run this script every 10 minutes. During the rest of the year, once a day or once a week will likely be sufficient.

## Script to Run When Course Evaluations Are Published
`scrapeEvaluations.js` populates the database with course evaluation information. When running the script, the user will be prompted to specify a “query for the courses for which you want to import the evaluations”. When prompted, press the return key to fetch the evaluations for all courses. This script scrapes the Registrar’s website and is throttled to 20 requests per second. This script takes 7-10 minutes to run.

## Scripts to Run When Course Listings Are Published
* `scrapeExtendedCourseDetails.js` populates the database with extended course details (assignments, grading, prerequisites, etc…). This script scrapes the Registrar’s website and is throttled to 20 requests per second. This script takes 7-10 minutes to run.
* `importDepartments.js` populates the database with the names and codes of all of the academic departments.
* `insertMostRecentScoreIntoUnevaluatedSemesters.js` inserts, into any course for which course evaluations have not yet been published, the “Overall Quality of the Course” score from the most recent time the instructor for this semester taught this course.
* `setNewCourseFlag.js` notes in the database whether a course has ever been taught before.
