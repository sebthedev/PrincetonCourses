// This script populates the database with all the departments from Princeton's Registrar
console.log('Starting script to update our database with latest course listings information from the Registrar.')

// Load config variables from the .env file
require('dotenv').config()

// Load external dependencies
var http = require('http')
var log = require('loglevel')
const spawn = require("child_process").spawn;
var $ = require('cheerio')

// Set the level of the logger to the first command line argument
// Valid values: "trace", "debug", "info", "warn", "error"
if (process.argv.length > 3) {
  log.setLevel(process.argv[3])
}

// Load internal modules
var departmentModel = require('../models/department.js')

// Connect to the database
require('../controllers/database.js')

let loadDepartmentsFromRegistrar = function (callback) {
  console.log("Requesting department details from the Registrar");

  let args = ["importers/mobileapp.py", "importDepartmentals"];
  const pythonMobileAppManager = spawn("python", args);
  res = "";
  pythonMobileAppManager.stdout.on("data", (data) => {
      res += data.toString("utf8");
  });
  pythonMobileAppManager.stdout.on("end", () => {
      callback(JSON.parse(res));
  });
  pythonMobileAppManager.on("error", (error) => {
      console.log(error);
  });
}

// Decode escaped HTML characters in a string, for example changing "Foo&amp;bar" to "Foo&bar"
let decodeEscapedCharacters = function (html) {
  return $('<div>' + $('<div>' + html + '</div>').text() + '</div>').text()
}

let handleData = function (data) {
  // Keep track of the number of subjects pending being saved to the database
  let pendingSubjects = 0

  // Iterate over each semester and subject to save to the database
  data.term.forEach(function (semester) {
    if (typeof (semester.subjects) !== 'undefined') {
      pendingSubjects += semester.subjects.length
      semester.subjects.forEach(function (subject) {
        departmentModel.findOneAndUpdate({
          _id: subject.code
        }, {
          _id: subject.code,
          name: decodeEscapedCharacters(subject.name)
        }, {
          new: true,
          upsert: true,
          runValidators: true
        }, function (error, semester) {
          if (error) {
            console.log('Creating or updating the subject %s failed.', subject.code)
          } else {
            console.log('Creating or updating the subject %s succeeded.', subject.code)
          }
          if (--pendingSubjects === 0) {
            console.log('Importing subjects complete.')
            process.exit(0)
          }
        })
      })
    }
  })
}

loadDepartmentsFromRegistrar(handleData)
