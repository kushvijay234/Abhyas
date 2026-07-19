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

// Delete Course
const deleteCourse = async(course_id) => {
    const [result] = await pool.execute(
        `DELETE FROM courses WHERE course_id = ?`, [course_id]
    );

    return result;
};

// Assign Course Category
const assignCourseCategory = async(course_id, category_id) => {
    const [result] = await pool.execute(
        `UPDATE courses SET category_id = ? WHERE course_id = ?`, [category_id, course_id]
    );

    return result;
};

// Get Course Curriculum
const getCurriculum = async(course_id) => {
    const [sections] = await pool.execute(
        `SELECT * FROM course_sections WHERE course_id = ? ORDER BY sort_order ASC`, [course_id]
    );

    if (sections.length === 0) return [];

    const sectionIds = sections.map(s => s.section_id);
    const placeHolders = sectionIds.map(() => '?').join(',');
    const [items] = await pool.execute(
        `SELECT ci.*, e.title AS exam_title
     FROM curriculum_items ci
     LEFT JOIN exams e ON ci.exam_id = e.exam_id
     WHERE ci.section_id IN (${placeHolders})
     ORDER BY ci.sort_order ASC`,
        sectionIds
    );

    const itemsBySection = {};
    items.forEach(item => {
        if (!itemsBySection[item.section_id]) {
            itemsBySection[item.section_id] = [];
        }
        itemsBySection[item.section_id].push(item);
    });

    return sections.map(sec => ({
        ...sec,
        items: itemsBySection[sec.section_id] || []
    }));
};

// Save Course Curriculum (Transaction-safe Bulk Update)
const saveCurriculum = async(course_id, sections) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Delete all existing sections
        await connection.execute(`DELETE FROM course_sections WHERE course_id = ?`, [course_id]);

        // 2. Insert new sections and nested items
        for (let i = 0; i < sections.length; i++) {
            const section = sections[i];
            const [secResult] = await connection.execute(
                `INSERT INTO course_sections (course_id, title, sort_order) VALUES (?, ?, ?)`, [course_id, section.title, i + 1]
            );
            const sectionId = secResult.insertId;

            if (section.items && section.items.length > 0) {
                for (let j = 0; j < section.items.length; j++) {
                    const item = section.items[j];
                    await connection.execute(
                        `INSERT INTO curriculum_items (section_id, title, type, duration, video_url, notes, exam_id, sort_order)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
                            sectionId,
                            item.title,
                            item.type,
                            item.duration || null,
                            item.video_url || null,
                            item.notes || null,
                            item.exam_id ? parseInt(item.exam_id) : null,
                            j + 1
                        ]
                    );
                }
            }
        }

        await connection.commit();
        return { success: true };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = {
    createCourse,
    getAllCourses,
    getCourseById,
    updateCourse,
    deleteCourse,
    assignCourseCategory,
    getCurriculum,
    saveCurriculum,
};