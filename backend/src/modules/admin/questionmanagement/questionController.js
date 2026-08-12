const QuestionService = require("./questionService");

// Add Single Question
const addQuestion = async (req, res) => {
  try {
    const result = await QuestionService.addQuestion(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Bulk Upload Questions
const bulkUploadQuestions = async (req, res) => {
  try {
    const result = await QuestionService.bulkUploadQuestions(req.body.questions);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Question
const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await QuestionService.updateQuestion(id, req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete Question
const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await QuestionService.deleteQuestion(id);
    res.status(200).json(result);
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// Assign Questions to Exam
const assignQuestionsToExam = async (req, res) => {
  try {
    const { exam_id, question_ids } = req.body;
    const result = await QuestionService.assignQuestionsToExam(exam_id, question_ids);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  addQuestion,
  bulkUploadQuestions,
  updateQuestion,
  deleteQuestion,
  assignQuestionsToExam,
};
