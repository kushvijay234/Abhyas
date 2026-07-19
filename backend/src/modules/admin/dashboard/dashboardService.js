const DashboardModel = require("./dashboardModel");

// Fetch all analytics in parallel
const getDashboardStats = async () => {
  const [
    totalUsers,
    totalCourses,
    totalExams,
    totalQuestions,
    totalAttempts,
    averageScore,
  ] = await Promise.all([
    DashboardModel.getTotalUsers(),
    DashboardModel.getTotalCourses(),
    DashboardModel.getTotalExams(),
    DashboardModel.getTotalQuestions(),
    DashboardModel.getTotalAttempts(),
    DashboardModel.getAverageScore(),
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
        average_score:   averageScore,
      },
    },
  };
};

module.exports = { getDashboardStats };
