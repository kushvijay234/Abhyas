const CourseModel = require("./courseModel");

// Create Course
const createCourse = async(courseData) => {
    const { title, description } = courseData;

    if (!title || title.trim() === "") {
        throw new Error("Course title is required");
    }

    if (!description || description.trim() === "") {
        throw new Error("Course description is required");
    }

    const result = await CourseModel.createCourse(courseData);

    if (!result.insertId) {
        throw new Error("Failed to create course");
    }

    return {
        success: true,
        message: "Course created successfully",
        data: { course_id: result.insertId },
    };
};


module.exports = {
    createCourse,
};