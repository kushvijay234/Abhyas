const AdminModel = require("./adminModel");

const getAllUsers = async (search, status) => {
    return await AdminModel.getAllUsers(search, status);
};

