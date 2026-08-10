const jwt = require("jsonwebtoken");
const ApiError = require("../utils/ApiError");
const User = require("../models/UserSchema");
const OTP = require("../models/OTPSchema");
const { jwt: jwtConfig } = require("../config/env");
const { sendVerificationEmail, sendPasswordResetEmail } = require("../services/EmailService");

const publicUser = (user) => ({
    id: user._id,
    fullName: user.fullName,
    employeeId: user.employeeId,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
    profilePicture: user.profilePicture,
    leaveBalance: user.leaveBalance,
});

const createOtp = async (email, purpose) => {
    await OTP.updateMany({ email, purpose, consumed: false }, { consumed: true });
    const code = String(Math.floor(100000 + Math.random() * 900000));
    await OTP.create({ email, code, purpose });
    return code;
};

const signToken = (user) =>
    jwt.sign({ id: user._id, role: user.role }, jwtConfig.secret, {
        expiresIn: jwtConfig.expiresIn,
    });

// Matches the default JWT_EXPIRES_IN of 7 days so the cookie and token expire together.
const cookieMaxAge = 7 * 24 * 60 * 60 * 1000;

const register = async (req, res) => {
    const { fullName, employeeId, email, password } = req.body;

    if (!fullName || !employeeId || !email || !password) {
        throw new ApiError("Full name, employee ID, email and password are required.", 400);
    }
    if (password.length < 6) {
        throw new ApiError("Password must be at least 6 characters.", 400);
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (await User.findOne({ email: normalizedEmail })) {
        throw new ApiError("An account with this email already exists.", 409);
    }
    if (await User.findOne({ employeeId })) {
        throw new ApiError("This employee ID is already registered.", 409);
    }

    const user = await User.create({ fullName, employeeId, email: normalizedEmail, password });

    const code = await createOtp(user.email, "email-verification");
    await sendVerificationEmail({ email: user.email, name: user.fullName, code });

    res.status(201).json({
        message: "Account created. A verification code has been sent to your email.",
        user: publicUser(user),
    });
};

const verifyEmail = async (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) {
        throw new ApiError("Email and verification code are required.", 400);
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
        throw new ApiError("No account found for this email.", 404);
    }

    const otp = await OTP.findOne({
        email: normalizedEmail,
        purpose: "email-verification",
        code,
        consumed: false,
    }).sort({ createdAt: -1 });

    if (!otp) {
        throw new ApiError("Invalid or expired verification code.", 400);
    }
    if (otp.expiresAt < new Date()) {
        throw new ApiError("This verification code has expired. Please request a new one.", 400);
    }

    otp.consumed = true;
    await otp.save();

    user.isVerified = true;
    await user.save();

    res.json({ message: "Email verified successfully. You can now log in." });
};

const resendOtp = async (req, res) => {
    const { email, purpose = "email-verification" } = req.body;
    if (!email) {
        throw new ApiError("Email is required.", 400);
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
        throw new ApiError("No account found for this email.", 404);
    }

    const code = await createOtp(user.email, purpose);
    if (purpose === "password-reset") {
        await sendPasswordResetEmail({ email: user.email, name: user.fullName, code });
    } else {
        await sendVerificationEmail({ email: user.email, name: user.fullName, code });
    }

    res.json({ message: "A new verification code has been sent to your email." });
};

const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        throw new ApiError("Email and password are required.", 400);
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
        throw new ApiError("Invalid email or password.", 401);
    }
    if (!user.isVerified) {
        throw new ApiError("Please verify your email before logging in.", 403);
    }

    const token = signToken(user);
    res.cookie("cr_token", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        maxAge: cookieMaxAge,
    });
    res.json({ message: "Logged in successfully.", token, user: publicUser(user) });
};

const logout = (req, res) => {
    res.clearCookie("cr_token");
    res.json({ message: "Logged out successfully." });
};

const forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        throw new ApiError("Email is required.", 400);
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
        res.json({ message: "If an account exists for this email, a reset code has been sent." });
        return;
    }

    const code = await createOtp(user.email, "password-reset");
    await sendPasswordResetEmail({ email: user.email, name: user.fullName, code });

    res.json({ message: "If an account exists for this email, a reset code has been sent." });
};

const resetPassword = async (req, res) => {
    const { email, code, password } = req.body;
    if (!email || !code || !password) {
        throw new ApiError("Email, reset code and new password are required.", 400);
    }
    if (password.length < 6) {
        throw new ApiError("Password must be at least 6 characters.", 400);
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
        throw new ApiError("No account found for this email.", 404);
    }

    const otp = await OTP.findOne({
        email: normalizedEmail,
        purpose: "password-reset",
        code,
        consumed: false,
    }).sort({ createdAt: -1 });

    if (!otp) {
        throw new ApiError("Invalid or expired reset code.", 400);
    }
    if (otp.expiresAt < new Date()) {
        throw new ApiError("This reset code has expired. Please request a new one.", 400);
    }

    otp.consumed = true;
    await otp.save();

    user.password = password;
    await user.save();

    res.json({ message: "Password reset successfully. You can now log in." });
};

module.exports = {
    register,
    verifyEmail,
    resendOtp,
    login,
    logout,
    forgotPassword,
    resetPassword,
};
