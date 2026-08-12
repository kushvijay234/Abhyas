const ResultModel = require("./resultModel");

// Get All My Results
const getResults = async (user_id) => {
  const data = await ResultModel.getMyResults(user_id);
  return {
    success: true,
    count: data.length,
    data,
  };
};

// Get Result By Attempt ID
const getResultById = async (user_id, attempt_id) => {
  if (!attempt_id) throw new Error("attempt_id is required");

  const result = await ResultModel.getResultById(attempt_id, user_id);
  if (!result) throw new Error("Result not found");

  const recommendations = await ResultModel.getRecommendationsForAttempt(attempt_id, user_id);
  result.recommendations = recommendations;

  return {
    success: true,
    data: result,
  };
};

// Get Latest Result For a Specific Exam
const getExamResult = async (user_id, exam_id) => {
  if (!exam_id) throw new Error("exam_id is required");

  const result = await ResultModel.getExamResult(exam_id, user_id);
  if (!result) throw new Error("No completed result found for this exam");

  return {
    success: true,
    data: result,
  };
};

// My Analytics Summary
const getAnalytics = async (user_id) => {
  const data = await ResultModel.getAnalytics(user_id);
  return {
    success: true,
    data,
  };
};

// Full Answer Review for Assessment Report
const getAnswerReview = async (user_id, attempt_id) => {
  if (!attempt_id) throw new Error('attempt_id is required');

  const data = await ResultModel.getAnswerReview(attempt_id, user_id);
  return {
    success: true,
    count: data.length,
    data,
  };
};

module.exports = { getResults, getResultById, getExamResult, getAnalytics, getAnswerReview };
