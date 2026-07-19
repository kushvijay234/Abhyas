const DashboardService = require("./dashboardService");

// Get Dashboard Analytics
const getDashboard = async (req, res) => {
  try {
    const result = await DashboardService.getDashboardStats();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = { getDashboard };
