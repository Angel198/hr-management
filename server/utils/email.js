import nodemailer from "nodemailer";

const isSmtpConfigured =
  Boolean(process.env.SMTP_HOST) &&
  Boolean(process.env.SMTP_PORT) &&
  Boolean(process.env.SMTP_USER) &&
  Boolean(process.env.SMTP_PASS);

let transporter = null;

if (isSmtpConfigured) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
} else {
  console.warn(
    "✉️  SMTP credentials are not fully configured. Employee emails will be logged to the console."
  );
}

const getLoginUrl = () => process.env.APP_LOGIN_URL || "http://localhost:8080/auth";

export const sendEmployeeCredentialsEmail = async ({ to, name, employeeId, password }) => {
  const subject = "Your HRMS login credentials";
  const loginUrl = getLoginUrl();
  const text = [
    `Hello ${name || "there"},`,
    "",
    "Your HRMS account has been created. Use the credentials below to sign in:",
    `Employee ID: ${employeeId}`,
    `Password: ${password}`,
    "",
    `Login: ${loginUrl}`,
    "",
    "You can change your password after logging in.",
    "",
    "Best,",
    "HRMS Team",
  ].join("\n");

  const html = `
    <p>Hello ${name || "there"},</p>
    <p>Your HRMS account has been created. Use the credentials below to sign in:</p>
    <ul>
      <li><strong>Employee ID:</strong> ${employeeId}</li>
      <li><strong>Password:</strong> ${password}</li>
    </ul>
    <p><a href="${loginUrl}" target="_blank" rel="noopener noreferrer">Access HRMS</a></p>
    <p>You can change your password after logging in.</p>
    <p>Best,<br />HRMS Team</p>
  `;

  if (!transporter) {
    console.log("\n[Email disabled]", { subject, to, text, html });
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@hrms.local",
    to,
    subject,
    text,
    html,
  });
};

export const sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
  const subject = "Reset your HRMS password";
  const text = [
    `Hello ${name || "there"},`,
    "",
    "We received a request to reset your HRMS password.",
    `Reset your password: ${resetUrl}`,
    "",
    "If you did not request a password reset, you can safely ignore this email.",
    "",
    "Best,",
    "HRMS Team",
  ].join("\n");

  const html = `
    <p>Hello ${name || "there"},</p>
    <p>We received a request to reset your HRMS password.</p>
    <p><a href="${resetUrl}" target="_blank" rel="noopener noreferrer">Reset your password</a></p>
    <p>If you did not request a password reset, you can safely ignore this email.</p>
    <p>Best,<br />HRMS Team</p>
  `;

  if (!transporter) {
    console.log("\n[Email disabled]", { subject, to, text, html });
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@hrms.local",
    to,
    subject,
    text,
    html,
  });
};

