const AdminService = require("./adminService");

const getAllUsers = async (req, res) => {
    try {
        const { search, status } = req.query;

        const users = await AdminService.getAllUsers(
            search,
            status
        );

        res.status(200).json({
            success: true,
            data: users,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await AdminService.getUserById(id);

        res.status(200).json({
            success: true,
            data: user,
        });

    } catch (error) {
        res.status(404).json({
            success: false,
            message: error.message,
        });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        await AdminService.deleteUser(id);

        res.status(200).json({
            success: true,
            message: "User deleted successfully",
        });

    } catch (error) {
        res.status(404).json({
            success: false,
            message: error.message,
        });
    }
};

const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        await AdminService.updateUserStatus(id, status);

        res.status(200).json({
            success: true,
            message: "User status updated successfully",
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    deleteUser,
    updateUserStatus,
};