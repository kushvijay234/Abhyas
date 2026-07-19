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