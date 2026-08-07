const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: [true, "Email is required"],
            lowercase: true,
            trim: true,
        },
        code: {
            type: String,
            required: [true, "OTP code is required"],
            trim: true,
        },
        purpose: {
            type: String,
            enum: ["email-verification", "password-reset"],
            default: "email-verification",
        },
        expiresAt: {
            type: Date,
            required: true,
            default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        },
        consumed: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

otpSchema.index({ email: 1, purpose: 1 });

const OTP = mongoose.model("OTP", otpSchema);

module.exports = OTP;
