const DashboardModel = require("./dashboardModel");

// Fetch all analytics in parallel
const getDashboardStats = async () => {
  const [
    totalUsers,
    totalCourses,
  ] = await Promise.all([
    DashboardModel.getTotalUsers(),
    DashboardModel.getTotalCourses(),
  ]);

  return {
    success: true,
    data: {
      overview: {
        total_users:     totalUsers,
        total_courses:   totalCourses,
      },
    },
  };
};

module.exports = { getDashboardStats };
