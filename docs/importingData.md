# Importing Data
Princeton courses has a collection of scripts in the `importers` folder that fetch course information from the Registrar’s servers. These scripts may require updating as the Registrar modifies their systems. Each of these scripts should be run from the root of the repository with the command `node importers/SCRIPTNAME.js`.

## Script to Run Periodically
`importBasicCourseDetails.js` populates the database with the details of each course, instructor, and semester. This script uses the Office of Information Technology’s [course offerings web feed](https://webfeeds.princeton.edu/#feed,19) and the Registrar's undocumented API. This script runs moderately quickly (around 5 minutes per semester of courses). This script should be run whenever there is new data to import. This script can be run automatically, such as every hour, to update the database.

* Running `node importers/importBasicCourseDetails.js` will load all courses from all semesters.
* Running `node importers/importBasicCourseDetails.js '&subject=all&term='` will load courses from the newest semester (whatever semester is the default on the registrar's website)

## Script to Run When Course Evaluations Are Published
`scrapeEvaluations.js` populates the database with course evaluation information. When running the script, the user will be prompted to specify a “query for the courses for which you want to import the evaluations”. When prompted, press the return key to fetch the evaluations for all courses. This script scrapes the Registrar’s website and is throttled to 20 requests per second. This script takes 7-10 minutes to run.

## Scripts to Run When Course Listings Are Published
* `importDepartments.js` populates the database with the names and codes of all of the academic departments.
* `insertMostRecentScoreIntoUnevaluatedSemesters.js` inserts, into any course for which course evaluations have not yet been published, the “Quality of Course” score from the most recent time the instructor for this semester taught this course.
* `setNewCourseFlag.js` notes in the database whether a course has ever been taught before.
