const CourseService = require("./courseService");

// Create Course
const createCourse = async(req, res) => {
    try {
        const result = await CourseService.createCourse(req.body);
        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

// Get All Courses
const getAllCourses = async(req, res) => {
    try {
        const { search, status } = req.query;
        const result = await CourseService.getAllCourses(search, status);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
getAllCourses,
module.exports = {
    createCourse,
    getAllCourses,

};