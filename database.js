// This script connects the app to the database

var mongoose = require('mongoose')

// Connect to the database
// The connection is made asynchronously.  Mongoose will queue up database
// operations and release them when the connection is complete.
console.log('Attempting to connect to the database.')
var mongoDBURI = process.env.MONGODB_URI
if (typeof (mongoDBURI) === 'undefined') {
  console.log("No database URI has been set in this app's config file. You must set the config variable 'MONGODB_URI' to point to a MongoDB database.")
  process.exit(1)
}
mongoose.connect(mongoDBURI, function (error, res) {
  if (error) {
    console.log('Connecting to the database failed. Databse URI: %s, Error: %s.', mongoDBURI, error)
    process.exit(1)
  } else {
    console.log('Connecting to the database succeeded.')
  }
})
