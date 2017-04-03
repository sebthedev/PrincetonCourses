# API Documentation
Princeton Courses uses a [RESTful API](https://en.wikipedia.org/wiki/Representational_state_transfer) to communicate between the client and server. This documentation explains the endpoints that are available for client use.

## Authentication
### Login
```HTTP
GET /auth/login
```
This will redirect the client to the Princeton Central Authentication System for login.
### Logout
```HTTP
GET /auth/logout
```
This will destroy the user's session cookie and redirect to the homepage.

## App Interactions
All of the following endpoints require the request to contain a valid session cookie (i.e. the user must be [logged in](#login)). If the request does not contain a valid session cookie the server will return `401 Unauthorized`.
### Search for Courses and Instructors
```HTTP
GET /api/search/:query
```
Return a JSON object of all the courses and instructors matching the URL-encoded search term `:query`. 
#### Parameters
* `semester`: Include only courses from the specified semester code (while still showing all matching instructors). By default courses from all semesters are returned. An example semester code is `1174` for Spring 2017.
* `sort`: Sort the results by the specified key in the objects. By default results are sorted by `relevance`. Other keys you might like to use for sorting include `title` and `rating`.
* `detailed`: Boolean (`true` or `false`) indicating whether to include more detailed information (such as their assignments, grading, classes, description, instructors, etc…) about the courses. Defaults to `false`.

#### Example
The following is a JavaScript example (using jQuery) of a search for all courses and instructors matching `Advanced Programming` in Spring 2016.
```JavaScript
$.get('/api/search/Advanced%20Programming?semester=1164', function (results, success) {
  if (success) {
    console.log(results)
  }
})
```
