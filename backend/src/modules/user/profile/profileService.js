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

// Change Password
const changePassword = async (user_id, current_password, new_password) => {
  if (!current_password || !new_password) {
    throw new Error("current_password and new_password are required");
  }
  if (new_password.length < 6) {
    throw new Error("new_password must be at least 6 characters");
  }

  const record = await ProfileModel.findPasswordById(user_id);
  if (!record) throw new Error("User not found");

  const isMatch = await bcrypt.compare(current_password, record.password);
  if (!isMatch) throw new Error("Current password is incorrect");

  const hashed = await bcrypt.hash(new_password, 10);
  await ProfileModel.updatePassword(user_id, hashed);

  return {
    success: true,
    message: "Password changed successfully",
  };
};