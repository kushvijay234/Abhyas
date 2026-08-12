const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const UserModel = require("../user/userModel");
const mailer = require("../../utils/mailer");

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

  // Send Welcome Email asynchronously
  mailer.sendWelcomeEmail(userData.email, userData.user_name).catch(err => {
    console.error("Failed to send welcome email:", err.message);
  });

  return {
    success: true,
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

// Request OTP for forgot password
const requestPasswordOTP = async (email) => {
  if (!email) {
    throw new Error("Email is required");
  }

  const user = await UserModel.findByEmail(email);

  if (!user) {
    throw new Error("User with this email does not exist");
  }

  // Generate 6-digit numeric OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  // 10-minute expiry
  const expiry = new Date(Date.now() + 10 * 60 * 1000);

  await UserModel.updateOTP(email, otp, expiry);

  // Send SMTP email with OTP
  await mailer.sendOTPEmail(email, otp);

  return {
    success: true,
    message: "OTP sent to your email address",
  };
};

// Reset password with OTP verification
const resetPassword = async (email, otp, password) => {
  if (!email || !otp || !password) {
    throw new Error("Email, OTP, and new password are required");
  }

  const user = await UserModel.findByEmail(email);

  if (!user) {
    throw new Error("User not found");
  }

  // Verify OTP
  const verifiedUser = await UserModel.verifyOTP(email, otp);
  if (!verifiedUser) {
    throw new Error("Invalid or expired OTP");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await UserModel.updatePassword(email, hashedPassword);
  await UserModel.clearOTP(email);

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
  requestPasswordOTP,
  updateProfile,
};
