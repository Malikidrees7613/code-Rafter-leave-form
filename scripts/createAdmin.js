// Bootstraps an admin account. Creates (or promotes) a user with role "admin",
// emails a 6-digit verification code, and verifies the code you enter from your inbox.
//
// Usage:
//   npm run create-admin
//   npm run create-admin -- --email=idreeslang007@gmail.com --full-name=Administrator --employee-id=ADMIN
//
// To avoid typing the password visibly in the terminal, set it first:
//   ADMIN_PASSWORD='YourPass123' npm run create-admin

const path = require("path");
require(path.join(__dirname, "..", "config/env"));
const readline = require("readline");
const connectDB = require("../db/connectDB");
const User = require("../models/UserSchema");
const OTP = require("../models/OTPSchema");
const { sendVerificationEmail } = require("../services/EmailService");

const DEFAULTS = {
    email: "idreeslang007@gmail.com",
    fullName: "Administrator",
    employeeId: "ADMIN",
};

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

const ask = (question) => new Promise((resolve) => rl.question(question, resolve));

const parseArgs = () => {
    const args = {};
    for (const arg of process.argv.slice(2)) {
        const match = arg.match(/^--([^=]+)=(.*)$/);
        if (match) args[match[1].toLowerCase()] = match[2];
    }
    return args;
};

const createOtp = async (email, purpose) => {
    await OTP.updateMany({ email, purpose, consumed: false }, { consumed: true });
    const code = String(Math.floor(100000 + Math.random() * 900000));
    await OTP.create({ email, code, purpose });
    return code;
};

const run = async () => {
    const args = parseArgs();
    const email = (args.email || process.env.ADMIN_EMAIL || DEFAULTS.email).toLowerCase().trim();
    const fullName = args["full-name"] || process.env.ADMIN_FULL_NAME || DEFAULTS.fullName;
    const employeeId = args["employee-id"] || process.env.ADMIN_EMPLOYEE_ID || DEFAULTS.employeeId;

    const password = process.env.ADMIN_PASSWORD || (await ask("Password (min 6 characters): "));
    if (!password || password.length < 6) {
        console.error("Password must be at least 6 characters.");
        process.exit(1);
    }

    await connectDB();

    let user = await User.findOne({ email });
    if (user) {
        user.role = "admin";
        user.isVerified = false;
        await user.save();
        console.log(`Existing user "${email}" promoted to admin.`);
    } else {
        user = await User.create({ fullName, employeeId, email, password, role: "admin" });
        console.log(`Admin user created: ${email} (${fullName}, ID ${employeeId}).`);
    }

    const code = await createOtp(email, "email-verification");
    await sendVerificationEmail({ email: user.email, name: user.fullName, code });
    console.log(`\nA 6-digit verification code was sent to ${email}.`);
    console.log("Check that inbox for the code (or the terminal running the server if no SendGrid key is set).\n");

    const entered = (await ask("Enter the 6-digit verification code: ")).trim();

    const otp = await OTP.findOne({
        email,
        purpose: "email-verification",
        code: entered,
        consumed: false,
    }).sort({ createdAt: -1 });

    if (!otp) {
        console.error("Invalid verification code. Run the script again to receive a fresh one.");
        process.exit(1);
    }
    if (otp.expiresAt < new Date()) {
        console.error("This verification code has expired. Run the script again to receive a fresh one.");
        process.exit(1);
    }

    otp.consumed = true;
    await otp.save();

    user.isVerified = true;
    await user.save();

    console.log("\nEmail verified. Admin account is ready.");
    console.log(`Sign in at http://localhost:3000/SignIn.html with ${email}`);
    process.exit(0);
};

run().catch((err) => {
    console.error("Failed to create admin:", err.message);
    process.exit(1);
});
