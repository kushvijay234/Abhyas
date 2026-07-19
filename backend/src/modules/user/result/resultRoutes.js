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

