const ProfileService = require("./profileService");

// Get Profile
const getProfile = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const result = await ProfileService.getProfile(user_id);
    res.status(200).json(result);
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

