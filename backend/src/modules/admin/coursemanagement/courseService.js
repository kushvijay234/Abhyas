const CourseModel = require("./courseModel");

// Create Course
const createCourse = async (courseData) => {
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
const getAllCourses = async (search, status) => {
  const courses = await CourseModel.getAllCourses(search, status);

  return {
    success: true,
    count: courses.length,
    data: courses,
  };
};

// Get Course By ID
const getCourseById = async (course_id) => {
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
const updateCourse = async (course_id, courseData) => {
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
const deleteCourse = async (course_id) => {
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

// Assign Course Category
const assignCourseCategory = async (course_id, category_id) => {
  if (!category_id) {
    throw new Error("Category ID is required");
  }

  const existing = await CourseModel.getCourseById(course_id);

  if (!existing) {
    throw new Error("Course not found");
  }

  const result = await CourseModel.assignCourseCategory(course_id, category_id);

  if (result.affectedRows === 0) {
    throw new Error("Failed to assign category");
  }

  return {
    success: true,
    message: "Category assigned to course successfully",
  };
};

// Get Course Curriculum
const getCurriculum = async (course_id) => {
  const existing = await CourseModel.getCourseById(course_id);
  if (!existing) {
    throw new Error("Course not found");
  }

  const data = await CourseModel.getCurriculum(course_id);
  return {
    success: true,
    data
  };
};

// Save Course Curriculum
const saveCurriculum = async (course_id, sections) => {
  const existing = await CourseModel.getCourseById(course_id);
  if (!existing) {
    throw new Error("Course not found");
  }

  await CourseModel.saveCurriculum(course_id, sections);
  return {
    success: true,
    message: "Curriculum saved successfully"
  };
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
