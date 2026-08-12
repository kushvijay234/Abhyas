const CourseModel = require("./courseModel");

// Get All Published Courses
const getCourses = async (search, category_id) => {
  const data = await CourseModel.getAllPublished(search, category_id);
  return {
    success: true,
    count: data.length,
    data,
  };
};

// Get Course Details
const getCourseDetails = async (course_id) => {
  if (!course_id) throw new Error("course_id is required");

  const course = await CourseModel.findById(course_id);
  if (!course) throw new Error("Course not found");

  const curriculum = await CourseModel.getCurriculum(course_id);
  course.curriculum = curriculum;

  return {
    success: true,
    data: course,
  };
};

// Get All Categories
const getCategories = async () => {
  const data = await CourseModel.getCategories();
  return {
    success: true,
    count: data.length,
    data,
  };
};

// My Enrolled Courses
const getMyCourses = async (user_id) => {
  const data = await CourseModel.getMyCourses(user_id);
  return {
    success: true,
    count: data.length,
    data,
  };
};

// Enroll in Course
const enrollInCourse = async (user_id, course_id) => {
  if (!course_id) throw new Error("course_id is required");

  // Check if course exists
  const course = await CourseModel.findById(course_id);
  if (!course) throw new Error("Course not found");

  // Check if already enrolled
  const isEnrolled = await CourseModel.checkEnrollment(user_id, course_id);
  if (isEnrolled) throw new Error("Already enrolled in this course");

  // Perform enrollment
  await CourseModel.enroll(user_id, course_id);
  return {
    success: true,
    message: "Enrolled in course successfully"
  };
};

module.exports = { getCourses, getCourseDetails, getCategories, getMyCourses, enrollInCourse };
