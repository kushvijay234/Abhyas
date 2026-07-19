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

// Bulk Upload Questions
const bulkUploadQuestions = async (questions) => {
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error("A non-empty questions array is required");
  }

  // Validate each question
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (!q.exam_id)        throw new Error(`Question ${i + 1}: exam_id is required`);
    if (!q.question_text)  throw new Error(`Question ${i + 1}: question_text is required`);
    if (!q.option_a || !q.option_b || !q.option_c || !q.option_d)
      throw new Error(`Question ${i + 1}: All four options are required`);
    if (!["A", "B", "C", "D"].includes(q.correct_option))
      throw new Error(`Question ${i + 1}: correct_option must be A, B, C, or D`);
  }

  const result = await QuestionModel.bulkInsertQuestions(questions);

  return {
    success: true,
    message: `${result.affectedRows} question(s) uploaded successfully`,
    data: { inserted: result.affectedRows },
  };
};