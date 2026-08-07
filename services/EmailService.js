const sendEmail = require("../utils/sendEmail");
const { appUrl } = require("../config/env");

const baseLayout = (title, bodyHtml) => `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#f2f4f6;font-family:Inter,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f2f4f6;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:520px;background-color:#ffffff;border:1px solid #e0e3e5;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="padding:24px 28px;border-bottom:1px solid #e0e3e5;">
              <span style="font-size:18px;font-weight:700;color:#3525cd;">Code Rafters</span>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <h1 style="margin:0 0 12px;font-size:20px;color:#191c1e;">${title}</h1>
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px;border-top:1px solid #e0e3e5;font-size:12px;color:#777587;">
              You received this email because of activity on your Code Rafters account.
              <br><a href="${appUrl}" style="color:#3525cd;">${appUrl}</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const otpCodeHtml = (code) => `
<p style="margin:0 0 16px;font-size:14px;color:#505f76;line-height:1.6;">Your one-time verification code is:</p>
<p style="margin:0 0 16px;font-size:32px;font-weight:700;letter-spacing:8px;color:#3525cd;text-align:center;">${code}</p>
<p style="margin:0;font-size:13px;color:#777587;">This code expires in 10 minutes. If you did not request it, you can safely ignore this email.</p>
`;

const sendVerificationEmail = ({ email, name, code }) => {
    const html = baseLayout(
        `Hi ${name}, please verify your email`,
        `<p style="margin:0 0 16px;font-size:14px;color:#505f76;line-height:1.6;">Welcome to Code Rafters. Confirm your email address to activate your account.</p>${otpCodeHtml(code)}`
    );
    return sendEmail({ to: email, subject: "Verify your Code Rafters account", html });
};

const sendPasswordResetEmail = ({ email, name, code }) => {
    const html = baseLayout(
        `Hi ${name}, reset your password`,
        `<p style="margin:0 0 16px;font-size:14px;color:#505f76;line-height:1.6;">We received a request to reset your password. Use the code below to set a new one.</p>${otpCodeHtml(code)}`
    );
    return sendEmail({ to: email, subject: "Reset your Code Rafters password", html });
};

const sendLeaveStatusEmail = ({ email, name, leave }) => {
    const labels = {
        annual: "Annual Leave",
        sick: "Sick Leave",
        personal: "Personal Leave",
        unpaid: "Unpaid Leave",
    };
    const statusColor = leave.status === "approved" ? "#0b7a3b" : leave.status === "rejected" ? "#ba1a1a" : "#505f76";
    const html = baseLayout(
        `Hi ${name}, your leave request was ${leave.status}`,
        `<p style="margin:0 0 16px;font-size:14px;color:#505f76;line-height:1.6;">Your request below has been <strong style="color:${statusColor};">${leave.status}</strong>.</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f9fb;border:1px solid #e0e3e5;border-radius:6px;font-size:14px;color:#191c1e;">
          <tr><td style="padding:12px 16px;"><strong>Leave type</strong></td><td style="padding:12px 16px;">${labels[leave.leaveType] || leave.leaveType}</td></tr>
          <tr><td style="padding:12px 16px;border-top:1px solid #e0e3e5;"><strong>Dates</strong></td><td style="padding:12px 16px;border-top:1px solid #e0e3e5;">${new Date(leave.startDate).toLocaleDateString()} - ${new Date(leave.endDate).toLocaleDateString()}</td></tr>
          <tr><td style="padding:12px 16px;border-top:1px solid #e0e3e5;"><strong>Duration</strong></td><td style="padding:12px 16px;border-top:1px solid #e0e3e5;">${leave.duration} day(s)</td></tr>
          ${leave.reviewNote ? `<tr><td style="padding:12px 16px;border-top:1px solid #e0e3e5;"><strong>Note</strong></td><td style="padding:12px 16px;border-top:1px solid #e0e3e5;">${leave.reviewNote}</td></tr>` : ""}
        </table>`
    );
    return sendEmail({ to: email, subject: `Your leave request was ${leave.status}`, html });
};

module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendLeaveStatusEmail,
};
