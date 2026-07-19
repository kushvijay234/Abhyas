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
    topStudents,
    recentActivities,
  ] = await Promise.all([
    DashboardModel.getTotalUsers(),
    DashboardModel.getTotalCourses(),
    DashboardModel.getTotalExams(),
    DashboardModel.getTotalQuestions(),
    DashboardModel.getTotalAttempts(),
    DashboardModel.getAverageScore(),
    DashboardModel.getTopPerformingStudents(5),
    DashboardModel.getRecentActivities(10),
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
      top_performing_students: topStudents,
      recent_activities:       recentActivities,
    },
  };
};

module.exports = { getDashboardStats };
