const ExamService = require("./examService");

// Get All Published Exams  (?search=&course_id=)
const getExams = async (req, res) => {
  try {
    const { search, course_id } = req.query;
    const result = await ExamService.getExams(search, course_id);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Start Exam
const startExam = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { exam_id } = req.params;
    const result = await ExamService.startExam(user_id, exam_id);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Submit Exam
const submitExam = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { attempt_id } = req.params;
    const { answers } = req.body; // [{ question_id, selected_option }]
    const result = await ExamService.submitExam(user_id, attempt_id, answers);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// View Result for a specific attempt
const viewResult = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { attempt_id } = req.params;
    const result = await ExamService.viewResult(user_id, attempt_id);
    res.status(200).json(result);
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

// Exam History
const getHistory = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const result = await ExamService.getHistory(user_id);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getExams, startExam, submitExam, viewResult, getHistory };
