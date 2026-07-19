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

// Get All Courses
const getAllCourses = async(search, status) => {
    const courses = await CourseModel.getAllCourses(search, status);

    return {
        success: true,
        count: courses.length,
        data: courses,
    };
};

// Get Course By ID
const getCourseById = async(course_id) => {
    const course = await CourseModel.getCourseById(course_id);

    if (!course) {
        throw new Error("Course not found");
    }

    return {
        success: true,
        data: course,
    };
};

// Update Course
const updateCourse = async(course_id, courseData) => {
    const existing = await CourseModel.getCourseById(course_id);

    if (!existing) {
        throw new Error("Course not found");
    }

    const result = await CourseModel.updateCourse(course_id, courseData);

    if (result.affectedRows === 0) {
        throw new Error("Course update failed");
    }

    return {
        success: true,
        message: "Course updated successfully",
    };
};

// Delete Course
const deleteCourse = async(course_id) => {
    const existing = await CourseModel.getCourseById(course_id);

    if (!existing) {
        throw new Error("Course not found");
    }

    const result = await CourseModel.deleteCourse(course_id);

    if (result.affectedRows === 0) {
        throw new Error("Course deletion failed");
    }

    return {
        success: true,
        message: "Course deleted successfully",
    };
};


module.exports = {
    createCourse,
    getAllCourses,
    getCourseById,
    updateCourse,
    deleteCourse,
};