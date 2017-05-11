# API Documentation
Princeton Courses uses a [RESTful API](https://en.wikipedia.org/wiki/Representational_state_transfer) to communicate between the client and server. This documentation explains the endpoints that are available for client use.

### Available endpoints
* [/auth/login](#login)
* [/auth/logout](#logout)
* [/api/search/:query](#search-for-courses-and-instructors)
* [/api/course/:id](#course)
* [/api/instructor/:id](#instructor)

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

### Semesters
```HTTP
GET /api/semesters
```
Return a JSON object of all the semesters for which the database contains course information.

### Departments
```HTTP
GET /api/departments
```
Return a JSON object of all the departments for which the database contains course information.

### Instructor
```HTTP
GET /api/instructor/:id
```
Return a JSON object of all the information about the instructor with the ID `:id`.

### Course
```HTTP
GET /api/course/:id
```
Return a JSON object of all the information about the course with the ID `:id`.

### Search for Courses and Instructors
```HTTP
GET /api/search/:query
```
Return a JSON object of all the courses and instructors matching the URL-encoded search term `:query`.
#### Parameters
* `semester`: Include only courses from the specified semester code (while still showing all matching instructors). By default courses from all semesters are returned. The semester ID is the format 1XXY, where XX is the two-digit representation of the year in which the academic year ends, and Y is 1 for summer, 2 for fall, 3 for winter, and 4 for spring. For example, Spring 2017 is 1174.
* `sort`: Sort the results by the specified key in the objects. By default results are sorted by `relevance`. Other keys you might like to use for sorting include `title` and `rating`.
* `detectClashes`: String “true” (default), “false”, or “filter”, indicating whether the results should contain information about whether each course clashes with the user’s list of courses for detecting clashes. If the value is “filter”, then any clashing courses will be excluded from search results.

### Favorite Courses
```HTTP
GET /api/user/favorites
```
Return a list of the user’s favorite courses.

```HTTP
PUT /api/user/favorites/:id
```
Add the course with the ID :id will be added to the user’s favorites list.

```HTTP
DELETE /api/user/favorites/:id
```
Remove the course with the ID :id from the user’s favorites list.
