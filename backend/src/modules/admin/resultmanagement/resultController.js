const ResultService = require("./resultService");

// View User Results
const getUserResults = async (req, res) => {
  try {
    const { user_id } = req.params;
    const result = await ResultService.getUserResults(user_id);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// View Exam Results
const getExamResults = async (req, res) => {
  try {
    const { exam_id } = req.params;
    const result = await ResultService.getExamResults(exam_id);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Generate Report
const generateReport = async (req, res) => {
  try {
    const filters = req.query; // exam_id, user_id, from_date, to_date
    const result = await ResultService.generateReport(filters);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Export Results (JSON default, CSV with ?format=csv)
const exportResults = async (req, res) => {
  try {
    const filters = req.query;
    const result = await ResultService.exportResults(filters);

    if (req.query.format === "csv") {
      const csvLines = [result.headers.join(",")];
      result.data.forEach((row) => {
        csvLines.push(row.map((v) => `"${v}"`).join(","));
      });
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=results_export_${Date.now()}.csv`
      );
      return res.status(200).send(csvLines.join("\n"));
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getUserResults,
  getExamResults,
  generateReport,
  exportResults,
};
