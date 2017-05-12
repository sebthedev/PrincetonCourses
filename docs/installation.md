# Installing Princeton Courses
Princeton Courses is a web app that you can run on any modern computer. Follow these instructions to run an installation of Princeton Courses on your computer.

1. To run Princeton Courses on a computer, you must have Node.js and the Heroku CLI (command line interface) installed. If running both `node -v` and `heroku -v` returns a reasonable-looking version number, then these are correctly installed.
2. Clone the Princeton Courses git repository to your computer by running `git clone https://github.com/sebthedev/PrincetonCourses.git` or by using the GitHub app.
3. `cd` into your clone of the repository and run `npm install` to install Princeton Courses’ dependencies.
4. In this folder, create a file named `.env` which will be used to store environment variables. Add a new line to this file with the text `MONGODB_URI='DATABASE_URL'` where `DATABASE_URL` is replaced with the `mongodb://` address of your MongoDB server and database. If you don’t have a MongoDB database already, you can host a database locally on your computer (instructions) or use a service like [mLab](https://www.mlab.com). Save this file.
4. Populate your database with the details about all the courses by running the following commands. For more information about what these scripts do, see [importingData.md](importingData.md).
    * `node importers/importBasicCourseDetails.js`
    * `node importers/scrapeEvaluations.js`
      (Press the return key when prompted.)
    * `node importers/scrapeExtendedCourseDetails.js`
    * `node importers/importDepartments.js`
    * `node importers/insertMostRecentScoreIntoUnevaluatedSemesters.js`
    * `node importers/setNewCourseFlag.js`
