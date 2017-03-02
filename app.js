// Greet the world!
console.log("Launching Princeton Courses.");

// Load external dependencies
var mongoose = require("mongoose");
var express = require("express");
var session = require('cookie-session');
var centralAuthenticationService = require('cas');
var app = express();

app.set('port', (process.env.PORT || 5000));
app.set('host', (process.env.HOST || "http://localhost:5000"));

// Load internal models
var courseModel = require("./course.js");
var userModel = require("./user.js");
var auth = require("./authentication.js");

// Connect to the database
// The connection is made asynchronously.  Mongoose will queue up database
// operations and release them when the connection is complete.
console.log("Attempting to connect to the database.");
var mongoDBURI = process.env.MONGODB_URI;
if (typeof(mongoDBURI) == "undefined") {
    console.log("No database URI has been set in this app's config file. You must set the config variable 'MONGODB_URI' to point to a MongoDB database.");
    process.exit(1);
}
mongoose.connect(mongoDBURI, function (error, res) {
  if (error) {
    console.log("Connecting to the database failed. Databse URI: %s, Error: %s.", mongoDBURI, error);
  } else {
    console.log("Connecting to the database succeeded.");
  }
});

// Configure CAS authentication
var casURL = "https://fed.princeton.edu/cas/";
var cas = new centralAuthenticationService({
    base_url : casURL,
    service : app.get('host') + "/verify"
});
app.use(session({ keys: ['key1', 'key2'] }));

// If the user is authenticated, load the user for the lifetime of this req
app.use("*", function(req, res, next) {
    if (req.session.cas) {
        userModel.findByNetid(req.session.cas.netid, function(doc) {
            if (doc != null) {
                app.set("user", doc);
            }
            next();
        });
    } else {
        next();
    }
})

// Route a req for the homepage
app.get('/', function(req, res) {
    // Check whether the user has authenticated
    if (!req.session.cas) {
        // The user in unauthenticated. Display a splash page.
        res.render("pages/splash");
    } else {
        // The user has authenticated. Display the app
        res.render("pages/app", {
            netid: app.get("user").netid
        });
    }
});

// Handle replies from CAS server about authentication
app.get('/verify', function(req, res) {
  if (!req.session.cas) {
        var ticket = req.param('ticket');
        if (ticket) {

            // Check if the user has a valid ticket
            cas.validate(ticket, function(err, status, netid) {
                if (err) {
                    res.send({ error: err });
                } else {
                    req.session.cas = {
                        status: status,
                        netid: netid
                    };

                    console.log("Searching the database for a user with netid %s", netid);
                    userModel.findByNetid(req.session.cas.netid, function(user) {
                        if (user == null) {
                            var user = new userModel({
                                netid : netid
                            });
                            user.save(function(error) {
                                if (error) {
                                    console.log("An error occured saving a user: %s", error);
                                }
                            });
                        }
                        app.set("user", user);
                    });

                    res.redirect('/');
                }
            });
        } else {
            res.redirect('/');
        }
  } else {
      res.redirect('/');
  }
});

app.get('/login', function(req, res) {
  res.redirect(casURL + "login?service=" + app.get('host') + "/verify");
});

app.get('/logout', function(req, res) {
  req.session = null;
  res.redirect('/');
});

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');



// Start listening for reqs
app.listen(app.get("port"), function() {
    console.log("Listening for reqs on port %d.", app.get("port"));
});
