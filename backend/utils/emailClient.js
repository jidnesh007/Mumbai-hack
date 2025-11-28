import dotenv from "dotenv";
dotenv.config();

import nodemailer from "nodemailer";

// IMPORTANT: Set these environment variables in your .env file
// E.g., EMAIL_USER=your_email@gmail.com, EMAIL_PASS=your_app_password
const transporter = nodemailer.createTransport({
  service: "gmail", // Use your preferred service (SendGrid, Mailgun, etc.)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Sends a transactional email to the specified recipient.
 */
export async function sendEmail(to, subject, htmlContent) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("Email credentials not set. Skipping email send.");
    return;
  }

  const mailOptions = {
    from: `CoachAI <${process.env.EMAIL_USER}>`,
    to: to,
    subject: subject,
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email summary.");
  }
}
