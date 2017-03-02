var mongoose = require("mongoose");

var courseSchema = new mongoose.Schema({
    department : {type: String, uppercase: true, trim: true},
    courseNumber : {type: Number, min: 100}
});

var course = mongoose.model('Course', courseSchema);

module.exports.courseSchema = courseSchema;
module.exports.courseModel = course;
