const CourseService = require("./courseService");

// Get All Published Courses  (?search=&category_id=)
const getCourses = async (req, res) => {
  try {
    const { search, category_id } = req.query;
    const result = await CourseService.getCourses(search, category_id);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};