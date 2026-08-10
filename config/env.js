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
    sendgrid: {
        apiKey: process.env.SENDGRID_API_KEY || "",
        from: process.env.SENDGRID_FROM || "idreeslang007@gmail.com",
    },
};

module.exports = env;
