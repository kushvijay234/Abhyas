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

const deleteUser = async (id) => {
    const result = await AdminModel.deleteUser(id);

    if (result.affectedRows === 0) {
        throw new Error("User not found");
    }

    return result;
};