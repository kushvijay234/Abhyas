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
    const { email, password } = req.body;

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

const getUsers = async (req, res) => {
  try {
    const users = await UserService.getUsers();

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  register,
  login,
  getUsers,
};