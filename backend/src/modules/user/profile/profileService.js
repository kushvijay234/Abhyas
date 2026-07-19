const bcrypt = require("bcryptjs");
const ProfileModel = require("./profileModel");

// Get Profile
const getProfile = async (user_id) => {
  const user = await ProfileModel.findById(user_id);
  if (!user) throw new Error("User not found");
  return {
    success: true,
    data: user,
  };
};