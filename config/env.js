const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const env = {
    port: parseInt(process.env.PORT || "3000", 10),
    appUrl: process.env.APP_URL || "http://localhost:3000",
    mongoUri: process.env.MONGODB_URI || "mongodb://localhost:27017/code-rafter-leave-form",
    jwt: {
        secret: process.env.JWT_SECRET || "dev-secret-change-me",
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    },
    email: {
        host: process.env.EMAIL_HOST || "",
        port: parseInt(process.env.EMAIL_PORT || "587", 10),
        user: process.env.EMAIL_USER || "",
        pass: process.env.EMAIL_PASS || "",
        from: process.env.EMAIL_FROM || "Code Rafters <no-reply@coderafters.com>",
    },
};

module.exports = env;
