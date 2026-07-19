const DashboardModel = require("./dashboardModel");

// Fetch all analytics in parallel
const getDashboardStats = async () => {
  const [
    totalUsers,
    totalCourses,
    totalExams,
    totalQuestions,
    totalAttempts,
  ] = await Promise.all([
    DashboardModel.getTotalUsers(),
    DashboardModel.getTotalCourses(),
    DashboardModel.getTotalExams(),
    DashboardModel.getTotalQuestions(),
    DashboardModel.getTotalAttempts(),
  ]);

  return {
    success: true,
    data: {
      overview: {
        total_users:     totalUsers,
        total_courses:   totalCourses,
        total_exams:     totalExams,
        total_questions: totalQuestions,
        total_attempts:  totalAttempts,
      },
    },
  };
};

module.exports = { getDashboardStats };
