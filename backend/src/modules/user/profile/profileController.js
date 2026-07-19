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

// Update Profile
const updateProfile = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const result = await ProfileService.updateProfile(user_id, req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Change Password
const changePassword = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { current_password, new_password } = req.body;
    const result = await ProfileService.changePassword(
      user_id,
      current_password,
      new_password
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

