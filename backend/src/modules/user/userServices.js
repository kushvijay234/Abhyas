const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const UserModel = require("../user/userModel");

// Register 
const registerUser = async (userData) => {
  const existingUser = await UserModel.findByEmail(userData.email);

  if (existingUser) {
    throw new Error("Email already exists");
  }

  const hashedPassword = await bcrypt.hash(userData.password, 10);

  await UserModel.createUser({
    ...userData,
    password: hashedPassword,
  });

  return {
    message: "User registered successfully",
  };
};

// Login 
const loginUser = async (email, password) => {
  const user = await UserModel.findByEmail(email);

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  const token = jwt.sign(
    {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    },
  );

  return {
    token,
    user: {
      user_id: user.user_id,
      user_name: user.user_name,
      email: user.email,
      role: user.role,
    },
  };
};


// rest password
const resetPassword = async (email, password) => {
  const user = await UserModel.findByEmail(email);

  if (!user) {
    throw new Error("User not found");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await UserModel.updatePassword(email, hashedPassword);

  return {
    success: true,
    message: "Password reset successfully",
  };
};

const updateProfile = async (user_id, user_name) => {
  // Validation
  if (!user_name || user_name.trim() === "") {
    throw new Error("User name is required");
  }

  // Check user exists
  const user = await UserModel.findById(user_id);

  if (!user) {
    throw new Error("User not found");
  }

  // Update profile
  const result = await UserModel.updateUserProfile(
    user_id,
    user_name.trim()
  );

  if (result.affectedRows === 0) {
    throw new Error("Profile update failed");
  }

  return {
    success: true,
    message: "Profile updated successfully",
    data: {
      user_id,
      user_name: user_name.trim(),
    },
  };
};

module.exports = {
  registerUser,
  loginUser,
  resetPassword,
  updateProfile,

};
