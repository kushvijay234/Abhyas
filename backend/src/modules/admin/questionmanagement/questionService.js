const QuestionModel = require("./questionModel");

// Add Single Question
const addQuestion = async (questionData) => {
  const { exam_id, question_text, option_a, option_b, option_c, option_d, correct_option } = questionData;

  if (!exam_id) throw new Error("Exam ID is required");
  if (!question_text || question_text.trim() === "") throw new Error("Question text is required");
  if (!option_a || !option_b || !option_c || !option_d) throw new Error("All four options (A, B, C, D) are required");
  if (!["A", "B", "C", "D"].includes(correct_option)) throw new Error("Correct option must be A, B, C, or D");

  const result = await QuestionModel.addQuestion(questionData);

  if (!result.insertId) {
    throw new Error("Failed to add question");
  }

  return {
    success: true,
    message: "Question added successfully",
    data: { question_id: result.insertId },
  };
};

