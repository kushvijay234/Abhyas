const ResultService = require("./resultService");

// Get All My Results
const getResults = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const result = await ResultService.getResults(user_id);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Result By Attempt ID
const getResultById = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { id } = req.params;
    const result = await ResultService.getResultById(user_id, id);
    res.status(200).json(result);
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};
