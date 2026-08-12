const DashboardService = require("./dashboardService");

// Summary Stats
const getSummary = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const result = await DashboardService.getSummary(user_id);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Performance Trend
const getPerformance = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const result = await DashboardService.getPerformance(user_id);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Recent Exams
const getRecentExams = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const result = await DashboardService.getRecentExams(user_id);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Upcoming Exams
const getUpcomingExams = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const result = await DashboardService.getUpcomingExams(user_id);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getSummary, getPerformance, getRecentExams, getUpcomingExams };
