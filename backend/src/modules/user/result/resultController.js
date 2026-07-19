const ResultService = require("./resultService");

// Get All My Results
const getResults = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const result = await ResultService.getResults(user_id);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Result By Attempt ID
const getResultById = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { id } = req.params;
    const result = await ResultService.getResultById(user_id, id);
    res.status(200).json(result);
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

// Get Latest Result For a Specific Exam
const getExamResult = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { exam_id } = req.params;
    const result = await ResultService.getExamResult(user_id, exam_id);
    res.status(200).json(result);
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

// My Analytics Summary
const getAnalytics = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const result = await ResultService.getAnalytics(user_id);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
