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

// Get All Courses
const getAllCourses = async(search = "", status = "") => {
    let query = `
    SELECT c.course_id, c.title, c.description, c.thumbnail, c.status,
           c.category_id, c.duration, cc.name AS category_name, c.created_at
    FROM courses c
    LEFT JOIN course_categories cc ON c.category_id = cc.category_id
    WHERE 1=1
  `;

    const params = [];

    if (search) {
        query += ` AND (c.title LIKE ? OR c.description LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`);
    }

    if (status) {
        query += ` AND c.status = ?`;
        params.push(status);
    }

    query += ` ORDER BY c.created_at DESC`;

    const [rows] = await pool.query(query, params);
    return rows;
};

// Get Course By ID
const getCourseById = async(course_id) => {
    const [rows] = await pool.execute(
        `SELECT c.course_id, c.title, c.description, c.thumbnail, c.status,
            c.category_id, c.duration, cc.name AS category_name, c.created_at
     FROM courses c
     LEFT JOIN course_categories cc ON c.category_id = cc.category_id
     WHERE c.course_id = ?`, [course_id]
    );

    return rows[0];
};

// Update Course
const updateCourse = async(course_id, courseData) => {
    const {
        title,
        description,
        thumbnail,
        status,
        category_id = null,
        duration = null,
    } = courseData;

    const [result] = await pool.execute(
        `UPDATE courses
     SET title = ?, description = ?, thumbnail = ?, status = ?, category_id = ?, duration = ?
     WHERE course_id = ?`, [title, description, thumbnail, status, category_id, duration, course_id]
    );

    return result;
};


module.exports = {
    createCourse,
    getAllCourses,
    getCourseById,
    updateCourse,
};