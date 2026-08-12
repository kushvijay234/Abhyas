const UserService = require("../user/userServices");

const register = async (req, res) => {
  try {
    const result = await UserService.registerUser(
      req.body
    );

    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

const login = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        message: "Request body is missing",
      });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const result = await UserService.loginUser(
      email,
      password
    );

    res.status(200).json(result);
  } catch (error) {
    res.status(401).json({
      message: error.message,
    });
  }
};


const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const result = await UserService.requestPasswordOTP(email);

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    const result = await UserService.resetPassword(
      email,
      otp,
      password
    );

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { user_name } = req.body;

    const result = await UserService.updateProfile(user_id, user_name);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  updateProfile,
};