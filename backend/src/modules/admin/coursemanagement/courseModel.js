const pool = require("../../../config/db");

// Create Course
const createCourse = async(courseData) => {
    const {
        title,
        description,
        category_id = null,
        thumbnail = null,
        status = "draft",
        duration = null,
    } = courseData;

    const [result] = await pool.execute(
        `INSERT INTO courses (title, description, category_id, thumbnail, status, duration)
     VALUES (?, ?, ?, ?, ?, ?)`, [title, description, category_id, thumbnail, status, duration]
    );

    return result;
};


module.exports = {
    createCourse,

};