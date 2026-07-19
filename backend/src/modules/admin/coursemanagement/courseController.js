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

module.exports = {
    createCourse,

};