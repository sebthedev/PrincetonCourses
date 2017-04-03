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

### Course
```HTTP
GET /api/course/:id
```
Return a JSON object of all the information about the course with the ID `:id`. Returns `400 Bad Request` if `:id` is not a number and `404 Not Found` if the course doesn't exist in the database.

In addition to the information contained in the database about the specified semester of the course, the JSON object returned will have an `evaluations` property. This is an array of the semesters for which evaluations exist for this course (sorted with the most recent semester first). Each semester contains the `scores`, `comments`, and `instructors` for that semester.

#### Example
The following is a JavaScript example (using jQuery) of fetching the information about COS 333 in Spring 2017.
```JavaScript
$.get('/api/course/1174002065', function (course, success) {
  if (success) {
    console.log(course)
  }
})
```

### Instructor
```HTTP
GET /api/instructor/:id
```
Return a JSON object of all the information about the instructor with the ID `:id`. Returns `400 Bad Request` if `:id` is not a number and `404 Not Found` if the course doesn't exist in the database.

#### Example
The following is a JavaScript example (using jQuery) of fetching the information about Brian Kernighan.
```JavaScript
$.get('/api/instructor/10043181', function (instructor, success) {
  if (success) {
    console.log(instructor)
  }
})
```
