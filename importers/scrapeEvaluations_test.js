// A script that uses Cheerio to scrape course evaluation information from the Registrar
// At the moment this script does not save the data anywhere

// Load external dependencies
const cheerio = require('cheerio')
const request = require('request')
const promptly = require('promptly')
require('colors')

// Load config variables from the .env file
require('dotenv').config()

// Load internal modules
const courseModel = require('../models/course.js')
require('../models/semester.js')
const evaluationModel = require('../models/evaluation.js')

let sessionCookie
let courses

// Load a request from the server and call the function externalCallback
const loadPage = function (term, courseID, callback) {
  // Define the HTTP request options
  const options = {
    url: 'https://reg-captiva.princeton.edu/chart/index.php?terminfo=' + term + '&courseinfo=' + courseID,
    headers: {
      'Cookie': `PHPSESSID=${sessionCookie};`,
      'User-Agent': 'Princeton Courses (https://www.princetoncourses.com)'
    }
  }

  request(options, (err, response, body) => {
    if (err) {
      return console.error(err)
    }
    callback(body)
  })
}

// Return the course evaluation data for the given semester/courseID to the function callback
const getCourseEvaluationData = function (semester, courseID, externalCallback) {
  loadPage(semester, courseID, function (data) {
    const $ = cheerio.load(data)
    if ($('title').text() !== 'Course Evaluation Results') {
      console.error('Scraping the evaluations failed. Your session cookie was probably bad. You must provide a valid session cookie.')
      console.log('Goodbye.')
      process.exit(1)
    }

    console.log('\tRecieved data for course %s in semester %s.', courseID, semester)

    // If this course is in the current semester, then the Registrar's page defaults back to the most recent semester for which course evaluations exist. This checks that we have indeed scraped the evaluations for the correct semester.
    if ($("td[bgcolor=Gainsboro] a[href*='terminfo=" + semester + "']").length !== 1) {
      externalCallback({}, [])
      return
    }

    // Get Chart Data
    const b64EncodedChartData = $('#chart_settings').attr('value')
    const scores = {}
    if (b64EncodedChartData) {
      const chartData = Buffer.from(b64EncodedChartData, 'base64').toString('ascii')
      const chart = JSON.parse(chartData)

      // Extract Numerical Evaluation Data from Chart
      const xItems = chart.PlotArea.XAxis.Items
      const yItems = chart.PlotArea.ListOfSeries[0].Items
      for (const itemIndex in chart.PlotArea.XAxis.Items) {
        scores[xItems[itemIndex].Text] = parseFloat(yItems[itemIndex].YValue)
      }
    }

    // Extract student comments
    const comments = []
    $('table:last-child tr:not(:first-child) td').each(function (index, element) {
      comments.push($(element).text().replace('\n', ' ').replace('\r', ' ').trim())
    })

    externalCallback(scores, comments)
  })
}

const instructions = [
  '\t1. Copy this JavaScript command: ' + 'document.cookie.match(/PHPSESSID=([^;]+)/)[1]'.yellow,
  '\t2. Visit this address in your web browser and run the copied JavaScript command in the developer console: https://reg-captiva.princeton.edu/chart/index.php\n'
]

console.log('Welcome to the script for scraping course evaluations from the Princeton University registrar\'s website.\n')
console.log('Course evaluations are protected behind Princeton\'s Central Authentication System. To scrape the course evaluations, follow these instructions:')
console.log(instructions[0])

sessionCookie = "ST-757199-Q9wHjjLfZIMQBBpfbbGa-auth-a";

// Connect to the database
require('../controllers/database.js')

const departments = {
  AAS: "African American Studies",
  AFS: "African Studies",
  AMS: "American Studies",
  ANT: "Anthropology",
  AOS: "Atmospheric & Oceanic Sciences",
  APC: "Appl and Computational Math",
  ARA: "Arabic",
  ARC: "Architecture",
  ART: "Art and Archaeology",
  AST: "Astrophysical Sciences",
  ATL: "Atelier",
  BCS: "Bosnian-Croatian-Serbian",
  CBE: "Chemical and Biological Engr",
  CEE: "Civil and Environmental Engr",
  CGS: "Cognitive Science",
  CHI: "Chinese",
  CHM: "Chemistry",
  CHV: "Center for Human Values",
  CLA: "Classics",
  CLG: "Classical Greek",
  COM: "Comparative Literature",
  COS: "Computer Science",
  CTL: "Center for Teaching & Learning",
  CWR: "Creative Writing",
  CZE: "Czech",
  DAN: "Dance",
  EAS: "East Asian Studies",
  ECO: "Economics",
  ECS: "European Cultural Studies",
  EEB: "Ecology and Evol Biology",
  EGR: "Engineering",
  ELE: "Electrical Engineering",
  ENE: "Energy Studies",
  ENG: "English",
  ENT: "Entrepreneurship",
  ENV: "Environmental Studies",
  EPS: "Contemporary European Politics",
  FIN: "Finance",
  FRE: "French",
  FRS: "Freshman Seminars",
  GEO: "Geosciences",
  GER: "German",
  GHP: "Global Health & Health Policy",
  GLS: "Global Seminar",
  GSS: "Gender and Sexuality Studies",
  HEB: "Hebrew",
  HIN: "Hindi",
  HIS: "History",
  HLS: "Hellenic Studies",
  HOS: "History of Science",
  HUM: "Humanistic Studies",
  ISC: "Integated Science Curriculum",
  ITA: "Italian",
  JDS: "Judaic Studies",
  JPN: "Japanese",
  JRN: "Journalism",
  KOR: "Korean",
  LAO: "Latino Studies",
  LAS: "Latin American Studies",
  LAT: "Latin",
  LCA: "Lewis Center for the Arts",
  LIN: "Linguistics",
  MAE: "Mech and Aerospace Engr",
  MAT: "Mathematics",
  MED: "Medieval Studies",
  MOD: "Media and Modernity",
  MOG: "Modern Greek",
  MOL: "Molecular Biology",
  MSE: "Materials Science and Engr",
  MTD: "Music Theater",
  MUS: "Music",
  NES: "Near Eastern Studies",
  NEU: "Neuroscience",
  ORF: "Oper Res and Financial Engr",
  PAW: "Ancient World",
  PER: "Persian",
  PHI: "Philosophy",
  PHY: "Physics",
  PLS: "Polish",
  POL: "Politics",
  POP: "Population Studies",
  POR: "Portuguese",
  PSY: "Psychology",
  QCB: "Quantitative Computational Bio",
  REL: "Religion",
  RES: "Russian, East Europ, Eurasian",
  RUS: "Russian",
  SAN: "Sanskrit",
  SAS: "South Asian Studies",
  SLA: "Slavic Languages and Lit",
  SML: "Statistics & Machine Learning",
  SOC: "Sociology",
  SPA: "Spanish",
  STC: "Science and Technology Council",
  SWA: "Swahili",
  THR: "Theater",
  TPP: "Teacher Preparation",
  TRA: "Translation, Intercultural Com",
  TUR: "Turkish",
  TWI: "Twi",
  URB: "Urban Studies",
  URD: "Urdu",
  VIS: "Visual Arts",
  WRI: "Princeton Writing Program",
  WWS: "Woodrow Wilson School",
};
const keys = Object.keys(departments);

keys.forEach((dep) => {
  console.log(dep);
  // Find an array of courses and populate the courses with the course evaluation information from the Registrar. Save the data to the database
  courseModel.find({ department: dep }).then(returnedCourses => {
    courses = returnedCourses;
    console.log("length:" + courses.length);
    let coursesPendingProcessing = courses.length;
    let courseIndex = 0;

    const interval = setInterval(function () {
      const thisCourse = courses[courseIndex++];

      // If there are no more courses, cease sending requests
      if (typeof thisCourse === "undefined") {
        clearInterval(interval);
        return;
      }

      console.log(
        `Processing course ${thisCourse.courseID} in semester ${thisCourse.semester._id}. (Course ${courseIndex} of ${courses.length}).`
      );

      // Fetch the evaluation data
      getCourseEvaluationData(
        thisCourse.semester._id,
        thisCourse.courseID,
        function (scores, comments) {
          let promises = [];

          // Iterate over the comments
          for (const comment of comments) {
            // Save the comments to the database
            promises.push(
              evaluationModel
                .findOneAndUpdate(
                  {
                    comment: comment,
                    course: thisCourse._id,
                  },
                  {
                    comment: comment,
                    course: thisCourse._id,
                  },
                  {
                    new: true,
                    upsert: true,
                    runValidators: true,
                    setDefaultsOnInsert: true,
                  }
                )
                .exec()
            );
          }

          // Update the course with the newly-fetched evaluation data
          if (scores !== {}) {
            promises.push(
              courseModel.update(
                {
                  _id: thisCourse._id,
                },
                {
                  $set: {
                    scores: scores,
                  },
                  $unset: {
                    scoresFromPreviousSemester: "",
                    scoresFromPreviousSemesterSemester: "",
                  },
                }
              )
            );
          }

          // Wait for all database operations to complete
          Promise.all(promises)
            .then(function () {
              if (coursesPendingProcessing % 10 === 0) {
                console.log(
                  `${coursesPendingProcessing} courses still processing…`
                );
              }
              if (--coursesPendingProcessing === 0) {
                console.log(
                  "Fetched and saved all the requested course evaluations."
                );
                process.exit(0);
              }
            })
            .catch(function (reason) {
              console.log(reason);
            });
        }
      );
    }, 500);
  });
});