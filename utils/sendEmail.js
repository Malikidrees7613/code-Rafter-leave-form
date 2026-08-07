const nodemailer = require("nodemailer");
const config = require("../config/env");

let transporter = null;

if (config.email.host && config.email.user && config.email.pass) {
    transporter = nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        secure: config.email.port === 465,
        auth: {
            user: config.email.user,
            pass: config.email.pass,
        },
    });
}

// Sends an email via Nodemailer. When SMTP is not configured, logs the message
// to the console so the auth flow stays testable in development.
const sendEmail = async ({ to, subject, html }) => {
    if (!transporter) {
        console.log("\n[DEV EMAIL] To:", to);
        console.log("[DEV EMAIL] Subject:", subject);
        console.log(`[DEV EMAIL] Body:\n${html}\n`);
        return { dev: true, to, subject };
    }

    return transporter.sendMail({
        from: config.email.from,
        to,
        subject,
        html,
    });
};

module.exports = sendEmail;
