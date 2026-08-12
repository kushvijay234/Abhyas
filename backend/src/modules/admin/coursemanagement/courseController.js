const CourseService = require("./courseService");

// Create Course
const createCourse = async (req, res) => {
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
const getAllCourses = async (req, res) => {
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

// Get Course By ID
const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await CourseService.getCourseById(id);
    res.status(200).json(result);
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Course
const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await CourseService.updateCourse(id, req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete Course
const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await CourseService.deleteCourse(id);
    res.status(200).json(result);
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// Assign Course Category
const assignCourseCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { category_id } = req.body;
    const result = await CourseService.assignCourseCategory(id, category_id);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Course Curriculum
const getCurriculum = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await CourseService.getCurriculum(id);
    res.status(200).json(result);
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// Save Course Curriculum
const saveCurriculum = async (req, res) => {
  try {
    const { id } = req.params;
    const { sections } = req.body;
    const result = await CourseService.saveCurriculum(id, sections);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
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
