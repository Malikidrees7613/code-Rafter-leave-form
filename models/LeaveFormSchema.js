const mongoose = require("mongoose");
const { calculateDays } = require("../utils/calculateDays");

const leaveFormSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Leave request must belong to a user"],
        },
        leaveType: {
            type: String,
            enum: ["annual", "sick", "personal", "unpaid"],
            required: [true, "Leave type is required"],
        },
        startDate: {
            type: Date,
            required: [true, "Start date is required"],
        },
        endDate: {
            type: Date,
            required: [true, "End date is required"],
        },
        duration: {
            type: Number,
            min: [1, "Leave duration must be at least 1 day"],
        },
        reason: {
            type: String,
            trim: true,
            maxlength: [1000, "Reason cannot exceed 1000 characters"],
        },
        emergencyContact: {
            type: String,
            trim: true,
        },
        attachment: {
            filename: String,
            path: String,
            size: Number,
            mimetype: String,
        },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected", "cancelled"],
            default: "pending",
        },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        reviewedAt: {
            type: Date,
            default: null,
        },
        reviewNote: {
            type: String,
            trim: true,
        },
    },
    { timestamps: true }
);

leaveFormSchema.pre("validate", function (next) {
    if (this.startDate && this.endDate) {
        this.duration = calculateDays(this.startDate, this.endDate);
    }
    next();
});

const LeaveForm = mongoose.model("LeaveForm", leaveFormSchema);

module.exports = LeaveForm;
