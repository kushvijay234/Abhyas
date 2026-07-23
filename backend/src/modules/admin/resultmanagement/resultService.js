const ResultModel = require("./resultModel");

// View User Results
const getUserResults = async (user_id) => {
  if (!user_id) throw new Error("User ID is required");

  const results = await ResultModel.getUserResults(user_id);

  return {
    success: true,
    count: results.length,
    data: results,
  };
};

// View Exam Results (with statistics)
const getExamResults = async (exam_id) => {
  if (!exam_id) throw new Error("Exam ID is required");

  const results = await ResultModel.getExamResults(exam_id);

  const total  = results.length;
  const passed = results.filter((r) => r.is_passed).length;
  const avgScore =
    total > 0
      ? (results.reduce((sum, r) => sum + Number(r.score), 0) / total).toFixed(2)
      : 0;

  return {
    success: true,
    count: total,
    stats: {
      total_attempts: total,
      passed,
      failed: total - passed,
      pass_rate: total > 0 ? ((passed / total) * 100).toFixed(2) + "%" : "0%",
      average_score: parseFloat(avgScore),
    },
    data: results,
  };
};

// Generate Report
const generateReport = async (filters) => {
  const results = await ResultModel.generateReport(filters);

  return {
    success: true,
    count: results.length,
    data: results,
  };
};

// Export Results (JSON or CSV)
const exportResults = async (filters) => {
  const results = await ResultModel.generateReport(filters);

  const headers = [
    "Result ID",
    "User Name",
    "Email",
    "Exam Title",
    "Score",
    "Total Marks",
    "Passed",
    "Time Taken (min)",
    "Attempted At",
  ];

  const rows = results.map((r) => [
    r.result_id,
    r.user_name,
    r.email,
    r.exam_title,
    r.score,
    r.total_marks,
    r.is_passed ? "Yes" : "No",
    r.time_taken_minutes,
    r.attempted_at,
  ]);

  return {
    success: true,
    count: rows.length,
    headers,
    data: rows,
  };
};

module.exports = {
  getUserResults,
  getExamResults,
  generateReport,
  exportResults,
};
