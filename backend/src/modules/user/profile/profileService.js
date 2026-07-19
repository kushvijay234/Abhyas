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

// Update Profile
const updateProfile = async (user_id, data) => {
  const { user_name, phone, bio, avatar } = data;

  if (!user_name || user_name.trim() === "") {
    throw new Error("user_name is required");
  }

  const user = await ProfileModel.findById(user_id);
  if (!user) throw new Error("User not found");

  const result = await ProfileModel.updateProfile(user_id, {
    user_name: user_name.trim(),
    phone: phone || null,
    bio: bio || null,
    avatar: avatar || null,
  });

  if (result.affectedRows === 0) throw new Error("Profile update failed");

  return {
    success: true,
    message: "Profile updated successfully",
  };
};