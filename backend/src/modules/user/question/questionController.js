const QuestionService = require("./questionService");

// Get Questions for an Exam  (?exam_id=)
const getQuestions = async (req, res) => {
  try {
    const { exam_id } = req.query;
    const result = await QuestionService.getQuestions(exam_id);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Save Answer
const saveAnswer = async (req, res) => {
  try {
    const { attempt_id, question_id, selected_option } = req.body;
    const result = await QuestionService.saveAnswer(
      attempt_id,
      question_id,
      selected_option
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Mark / Unmark Question for Review
const markReview = async (req, res) => {
  try {
    const { attempt_id, question_id, is_marked } = req.body;
    const result = await QuestionService.markReview(
      attempt_id,
      question_id,
      is_marked
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get Answer Status for an Attempt
const getAnswerStatus = async (req, res) => {
  try {
    const { attempt_id } = req.params;
    const result = await QuestionService.getAnswerStatus(attempt_id);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { getQuestions, saveAnswer, markReview, getAnswerStatus };
