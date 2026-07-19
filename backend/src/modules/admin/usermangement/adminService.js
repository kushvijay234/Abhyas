const AdminModel = require("./adminModel");

const getAllUsers = async (search, status) => {
  return await AdminModel.getAllUsers(search, status);
};

const getUserById = async (id) => {
  const user = await AdminModel.getUserById(id);

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};
