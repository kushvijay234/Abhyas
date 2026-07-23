const QuestionModel = require("./questionModel");

// Get Questions for an Exam (no correct_option exposed)
const getQuestions = async (exam_id) => {
  if (!exam_id) throw new Error("exam_id is required");

  const data = await QuestionModel.getQuestionsByExam(exam_id);
  return {
    success: true,
    count: data.length,
    data,
  };
};

// Save Answer for a Question
const saveAnswer = async (attempt_id, question_id, selected_option) => {
  if (!attempt_id || !question_id || !selected_option) {
    throw new Error("attempt_id, question_id, and selected_option are required");
  }

  const validOptions = ["a", "b", "c", "d", "A", "B", "C", "D"];
  if (!validOptions.includes(selected_option)) {
    throw new Error("selected_option must be one of: a, b, c, d");
  }

  await QuestionModel.saveAnswer(attempt_id, question_id, selected_option.toLowerCase());

  return {
    success: true,
    message: "Answer saved successfully",
  };
};

// Mark / Unmark a Question for Review
const markReview = async (attempt_id, question_id, is_marked) => {
  if (attempt_id === undefined || question_id === undefined || is_marked === undefined) {
    throw new Error("attempt_id, question_id, and is_marked are required");
  }

  const flagged = is_marked ? 1 : 0;
  await QuestionModel.markForReview(attempt_id, question_id, flagged);

  return {
    success: true,
    message: `Question ${flagged ? "marked" : "unmarked"} for review`,
  };
};

// Get All Answer Statuses for an Attempt
const getAnswerStatus = async (attempt_id) => {
  if (!attempt_id) throw new Error("attempt_id is required");

  const data = await QuestionModel.getAnswerStatus(attempt_id);
  return {
    success: true,
    attempt_id,
    data,
  };
};

module.exports = { getQuestions, saveAnswer, markReview, getAnswerStatus };
