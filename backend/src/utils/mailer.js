const nodemailer = require("nodemailer");

// Create standard transporter
const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  // Check if credentials are placeholders or empty
  if (!host || !user || !pass || user.includes("your_email") || pass.includes("your_app_password")) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: parseInt(port),
    secure: port == 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
  });
};

const sendEmail = async (options) => {
  const transporter = getTransporter();
  const fromEmail = process.env.SMTP_FROM || `"Abhyas" <no-reply@abhyas.com>`;

  if (!transporter) {
    console.warn(`\x1b[33m[MAILER WARNING] SMTP is not configured or contains placeholder credentials.\x1b[0m`);
    console.log(`\x1b[36m========================================================================\x1b[0m`);
    console.log(`\x1b[36m[SIMULATED EMAIL SENT]\x1b[0m`);
    console.log(`\x1b[1mTo:\x1b[0m ${options.to}`);
    console.log(`\x1b[1mSubject:\x1b[0m ${options.subject}`);
    console.log(`\x1b[1mBody:\x1b[0m\n${options.text}`);
    console.log(`\x1b[36m========================================================================\x1b[0m`);
    return { simulated: true, messageId: "simulated-id-" + Date.now() };
  }

  try {
    const info = await transporter.sendMail({
      from: fromEmail,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    console.log(`Email sent successfully: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("Error sending email via SMTP, falling back to console log:", error.message);
    console.log(`\x1b[36m========================================================================\x1b[0m`);
    console.log(`\x1b[31m[SMTP FAILED - FALLBACK EMAIL LOG]\x1b[0m`);
    console.log(`\x1b[1mTo:\x1b[0m ${options.to}`);
    console.log(`\x1b[1mSubject:\x1b[0m ${options.subject}`);
    console.log(`\x1b[1mBody:\x1b[0m\n${options.text}`);
    console.log(`\x1b[36m========================================================================\x1b[0m`);
    return { simulated: true, error: error.message };
  }
};

const sendOTPEmail = async (email, otp) => {
  const subject = "Reset Your Password - Abhyas";
  const text = `Hello,

We received a request to reset your password for your Abhyas account.
Your 6-digit verification One-Time Password (OTP) is:

👉 ${otp} 👈

This code is valid for 10 minutes. If you did not request a password reset, please ignore this email.

Best regards,
The Abhyas Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #1c2660; text-align: center;">Abhyas Password Reset</h2>
      <p>Hello,</p>
      <p>We received a request to reset your password for your Abhyas account. Please use the following One-Time Password (OTP) to proceed:</p>
      <div style="background-color: #f3f4f6; border-radius: 8px; padding: 15px; text-align: center; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #f97316;">${otp}</span>
      </div>
      <p>This code is valid for <strong>10 minutes</strong>. If you did not request this password reset, please ignore this email.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #777; text-align: center;">This is an automated email. Please do not reply directly.</p>
    </div>
  `;

  return sendEmail({ to: email, subject, text, html });
};

const sendWelcomeEmail = async (email, userName) => {
  const subject = "Welcome to Abhyas! 🚀";
  const text = `Hello ${userName},

Thank you for registering on Abhyas, India's premier practice and mock exam platform! We're excited to support your learning journey.

Here's how to get started:
1. Log in to your student dashboard.
2. Enroll in courses that fit your targets.
3. Attempt mock exams to evaluate your ranking.

If you have any questions or feedback, feel free to contact us.

Keep learning, keep practicing!
#AbhyasKartaRaho

Best regards,
The Abhyas Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #1c2660; text-align: center;">Welcome to Abhyas! 🚀</h2>
      <p>Hello <strong>${userName}</strong>,</p>
      <p>Thank you for registering on Abhyas, India's premier practice and mock exam platform! We are thrilled to support your learning journey.</p>
      <p>Here is how you can get started:</p>
      <ul style="line-height: 1.6;">
        <li>Log in to your student dashboard.</li>
        <li>Browse and enroll in high-quality courses.</li>
        <li>Attempt mock exams to track your rank and performance.</li>
      </ul>
      <div style="text-align: center; margin: 30px 0;">
        <a href="http://localhost:5173/login" style="background-color: #1c2660; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Get Started</a>
      </div>
      <p style="font-style: italic; color: #f97316; font-weight: bold; text-align: center;">#AbhyasKartaRaho</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #777; text-align: center;">The Abhyas Team</p>
    </div>
  `;

  return sendEmail({ to: email, subject, text, html });
};

module.exports = {
  sendOTPEmail,
  sendWelcomeEmail,
};
