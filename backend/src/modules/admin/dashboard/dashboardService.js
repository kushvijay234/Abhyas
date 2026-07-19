const DashboardModel = require("./dashboardModel");

// Fetch all analytics in parallel
const getDashboardStats = async () => {
  const [
    totalUsers,
    totalCourses,
    totalExams,
    totalQuestions,
  ] = await Promise.all([
    DashboardModel.getTotalUsers(),
    DashboardModel.getTotalCourses(),
    DashboardModel.getTotalExams(),
    DashboardModel.getTotalQuestions(),
  ]);

  return {
    success: true,
    data: {
      overview: {
        total_users:     totalUsers,
        total_courses:   totalCourses,
        total_exams:     totalExams,
        total_questions: totalQuestions,
      },
    },
  };
};

module.exports = { getDashboardStats };
