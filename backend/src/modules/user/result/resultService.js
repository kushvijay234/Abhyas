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

  return {
    success: true,
    data: result,
  };
};