const ApiError = require("../utils/ApiError");
const LeaveForm = require("../models/LeaveFormSchema");
const User = require("../models/UserSchema");
const { sendLeaveStatusEmail } = require("../services/EmailService");

const BALANCE_KEYS = { annual: "annual", sick: "sick" };

const createLeave = async (req, res) => {
    const { leaveType, startDate, endDate, reason, emergencyContact } = req.body;

    if (!leaveType || !startDate || !endDate) {
        throw new ApiError("Leave type, start date and end date are required.", 400);
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        throw new ApiError("Please provide valid start and end dates.", 400);
    }
    if (end < start) {
        throw new ApiError("End date cannot be before the start date.", 400);
    }

    const attachment = req.file
        ? {
              filename: req.file.originalname,
              path: `/uploads/${req.file.filename}`,
              size: req.file.size,
              mimetype: req.file.mimetype,
          }
        : null;

    const leave = await LeaveForm.create({
        user: req.user._id,
        leaveType,
        startDate: start,
        endDate: end,
        reason,
        emergencyContact,
        attachment,
    });

    const balanceKey = BALANCE_KEYS[leaveType];
    if (balanceKey && leave.duration > req.user.leaveBalance[balanceKey]) {
        await LeaveForm.findByIdAndDelete(leave._id);
        throw new ApiError(
            `Insufficient ${leaveType} leave balance (${req.user.leaveBalance[balanceKey]} day(s) remaining).`,
            400
        );
    }

    res.status(201).json({ message: "Leave request submitted successfully.", leave });
};

const getMyLeaves = async (req, res) => {
    const filter = { user: req.user._id };
    if (req.query.status && ["pending", "approved", "rejected", "cancelled"].includes(req.query.status)) {
        filter.status = req.query.status;
    }

    const leaves = await LeaveForm.find(filter).sort({ createdAt: -1 });
    res.json({ results: leaves.length, leaves });
};

const getAllLeaves = async (req, res) => {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "10", 10), 1), 100);
    const filter = {};

    if (req.query.status && ["pending", "approved", "rejected", "cancelled"].includes(req.query.status)) {
        filter.status = req.query.status;
    }
    if (req.query.user) {
        filter.user = req.query.user;
    }

    const [leaves, total] = await Promise.all([
        LeaveForm.find(filter)
            .populate("user", "fullName email employeeId")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit),
        LeaveForm.countDocuments(filter),
    ]);

    res.json({ results: leaves.length, total, page, pages: Math.ceil(total / limit), leaves });
};

const getLeaveStats = async (req, res) => {
    const [total, pending, approved, rejected, cancelled] = await Promise.all([
        LeaveForm.countDocuments({}),
        LeaveForm.countDocuments({ status: "pending" }),
        LeaveForm.countDocuments({ status: "approved" }),
        LeaveForm.countDocuments({ status: "rejected" }),
        LeaveForm.countDocuments({ status: "cancelled" }),
    ]);

    res.json({ total, pending, approved, rejected, cancelled });
};

const getLeaveById = async (req, res) => {
    const leave = await LeaveForm.findById(req.params.id).populate("user", "fullName email employeeId");
    if (!leave) {
        throw new ApiError("Leave request not found.", 404);
    }

    const isOwner = leave.user && leave.user._id.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "admin") {
        throw new ApiError("You do not have permission to view this request.", 403);
    }

    res.json({ leave });
};

const updateLeaveStatus = async (req, res) => {
    const { status, reviewNote } = req.body;
    if (!["approved", "rejected"].includes(status)) {
        throw new ApiError("Status must be either 'approved' or 'rejected'.", 400);
    }

    const leave = await LeaveForm.findById(req.params.id).populate("user");
    if (!leave) {
        throw new ApiError("Leave request not found.", 404);
    }
    if (leave.status !== "pending") {
        throw new ApiError("This request has already been reviewed.", 400);
    }

    leave.status = status;
    leave.reviewedBy = req.user._id;
    leave.reviewedAt = new Date();
    leave.reviewNote = reviewNote || "";

    if (status === "approved") {
        const balanceKey = BALANCE_KEYS[leave.leaveType];
        if (balanceKey && leave.user) {
            const remaining = leave.user.leaveBalance[balanceKey] - leave.duration;
            leave.user.leaveBalance[balanceKey] = Math.max(remaining, 0);
            await leave.user.save();
        }
    }

    await leave.save();

    if (leave.user) {
        await sendLeaveStatusEmail({
            email: leave.user.email,
            name: leave.user.fullName,
            leave,
        });
    }

    res.json({ message: `Leave request ${status}.`, leave });
};

const cancelLeave = async (req, res) => {
    const leave = await LeaveForm.findById(req.params.id);
    if (!leave) {
        throw new ApiError("Leave request not found.", 404);
    }
    if (leave.user.toString() !== req.user._id.toString()) {
        throw new ApiError("You can only cancel your own requests.", 403);
    }
    if (leave.status !== "pending") {
        throw new ApiError("Only pending requests can be cancelled.", 400);
    }

    leave.status = "cancelled";
    await leave.save();

    res.json({ message: "Leave request cancelled.", leave });
};

const deleteLeave = async (req, res) => {
    const leave = await LeaveForm.findById(req.params.id);
    if (!leave) {
        throw new ApiError("Leave request not found.", 404);
    }

    const isOwner = leave.user.toString() === req.user._id.toString();
    const isPending = leave.status === "pending";
    if (!isOwner && req.user.role !== "admin") {
        throw new ApiError("You do not have permission to delete this request.", 403);
    }
    if (isOwner && !isPending && req.user.role !== "admin") {
        throw new ApiError("Only pending requests can be deleted.", 400);
    }

    await LeaveForm.findByIdAndDelete(leave._id);
    res.status(204).end();
};

module.exports = {
    createLeave,
    getMyLeaves,
    getAllLeaves,
    getLeaveStats,
    getLeaveById,
    updateLeaveStatus,
    cancelLeave,
    deleteLeave,
};
