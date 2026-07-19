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

