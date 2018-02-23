// This script loads configuration information
// Other scripts import it to gain access to important configuration details

// The URL of our MongoDB database
var mongoDBURI = process.env.MONGODB_URI
if (typeof (mongoDBURI) === 'undefined') {
  console.log("No database URI has been set in this app's config file. You must set the config variable 'MONGODB_URI' to point to a MongoDB database.")
  process.exit(1)
}
module.exports.mongoDBURI = mongoDBURI

// The domain and port on which the app is running
var host = process.env.HOST || 'http://localhost:5000'
module.exports.host = host

// The domain and port on which the app is running
var port = process.env.PORT || 500
module.exports.port = port

// The secret used to encrypt session database
module.exports.sessionSecret = process.env.SESSION_SECRET || 'abcdefghijklmnop'
