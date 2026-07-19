const DashboardModel = require("./dashboardModel");

// Fetch all analytics in parallel
const getDashboardStats = async () => {
  const [
    totalUsers,
  ] = await Promise.all([
    DashboardModel.getTotalUsers(),
  ]);

  return {
    success: true,
    data: {
      overview: {
        total_users:     totalUsers,
      },
    },
  };
};

module.exports = { getDashboardStats };
