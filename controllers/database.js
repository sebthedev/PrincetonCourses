// This script connects the app to the database

// Load external dependencies
var mongoose = require('mongoose')

// Load internal modules
var config = require('./config.js')

// Connect to the database
// The connection is made asynchronously.  Mongoose will queue up database
// operations and release them when the connection is complete.
console.log('Attempting to connect to the database.')
mongoose.Promise = global.Promise
mongoose.connect(config.mongoDBURI, {useMongoClient: true}, function (error, res) {
  if (error) {
    console.log('Connecting to the database failed. Databse URI: %s, Error: %s.', config.mongoDBURI, error)
    process.exit(1)
  } else {
    console.log('Connecting to the database succeeded.')
  }
})
