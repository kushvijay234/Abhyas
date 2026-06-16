const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const UserModel = require("../user/userModel");

const registerUser = async (userData) => {
  const existingUser = await UserModel.findByEmail(userData.email);

  if (existingUser) {
    throw new Error("Email already exists");
  }

  const hashedPassword = await bcrypt.hash(
    userData.password,
    10
  );

  await UserModel.createUser({
    ...userData,
    password: hashedPassword,
  });

  return {
    message: "User registered successfully",
  };
};

const loginUser = async (email, password) => {
  const user = await UserModel.findByEmail(email);

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isMatch = await bcrypt.compare(
    password,
    user.password
  );

  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    }
  );

  return {
    token,
    user: {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
    },
  };
};

const getUsers = async () => {
  return await UserModel.getAllUsers();
};

module.exports = {
  registerUser,
  loginUser,
  getUsers,
};