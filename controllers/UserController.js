const ApiError = require("../utils/ApiError");
const User = require("../models/UserSchema");

const publicUser = (user) => ({
    id: user._id,
    fullName: user.fullName,
    employeeId: user.employeeId,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
    profilePicture: user.profilePicture,
    leaveBalance: user.leaveBalance,
    createdAt: user.createdAt,
});

const getProfile = async (req, res) => {
    res.json({ user: publicUser(req.user) });
};

const updateProfile = async (req, res) => {
    const updates = {};
    if (req.body.fullName) updates.fullName = req.body.fullName;
    if (req.file) updates.profilePicture = `/uploads/${req.file.filename}`;

    if (Object.keys(updates).length > 0) {
        Object.assign(req.user, updates);
        await req.user.save();
    }

    res.json({ message: "Profile updated successfully.", user: publicUser(req.user) });
};

const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        throw new ApiError("Current and new password are required.", 400);
    }
    if (newPassword.length < 6) {
        throw new ApiError("New password must be at least 6 characters.", 400);
    }

    const user = await User.findById(req.user._id).select("+password");
    if (!(await user.comparePassword(currentPassword))) {
        throw new ApiError("Current password is incorrect.", 401);
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: "Password changed successfully." });
};

const getAllUsers = async (req, res) => {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "10", 10), 1), 100);
    const filter = {};
    if (req.query.role && ["employee", "admin"].includes(req.query.role)) {
        filter.role = req.query.role;
    }

    const [users, total] = await Promise.all([
        User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
        User.countDocuments(filter),
    ]);

    res.json({ results: users.length, total, page, pages: Math.ceil(total / limit), users });
};

const getUserById = async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        throw new ApiError("User not found.", 404);
    }
    res.json({ user });
};

const updateUser = async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        throw new ApiError("User not found.", 404);
    }

    const allowedFields = ["fullName", "employeeId", "email", "role", "isVerified", "leaveBalance"];
    for (const field of allowedFields) {
        if (req.body[field] !== undefined) user[field] = req.body[field];
    }

    await user.save();
    res.json({ message: "User updated successfully.", user: publicUser(user) });
};

const deleteUser = async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        throw new ApiError("User not found.", 404);
    }
    if (user._id.toString() === req.user._id.toString()) {
        throw new ApiError("You cannot delete your own account.", 400);
    }

    await User.findByIdAndDelete(user._id);
    res.status(204).end();
};

module.exports = {
    getProfile,
    updateProfile,
    changePassword,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
};
