const DashboardModel = require("./dashboardModel");

// Fetch all analytics in parallel
const getDashboardStats = async () => {
  const [
    totalUsers,
    totalCourses,
    totalExams,
  ] = await Promise.all([
    DashboardModel.getTotalUsers(),
    DashboardModel.getTotalCourses(),
    DashboardModel.getTotalExams(),
  ]);

  return {
    success: true,
    data: {
      overview: {
        total_users:     totalUsers,
        total_courses:   totalCourses,
        total_exams:     totalExams,
      },
    },
  };
};

module.exports = { getDashboardStats };
