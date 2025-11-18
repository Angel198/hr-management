import express from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import Employee from "../models/Employee.js";
import { sendPasswordResetEmail } from "../utils/email.js";

const router = express.Router();
const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 10);

const toEmployeeDto = (employee) => ({
  id: employee.id,
  name: employee.name,
  email: employee.email,
  phone: employee.phone,
  department: employee.department,
  designation: employee.designation,
  status: employee.status,
  createdAt: employee.createdAt,
  updatedAt: employee.updatedAt,
});

router.post("/employee", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const employee = await Employee.findOne({ email: email.toLowerCase() }).select("+password");
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    if (!employee.password) {
      // Backward-compatibility: legacy employees used employee ID as password
      if (password !== employee.id) {
        return res
          .status(401)
          .json({ message: "Invalid credentials. Please contact HR to reset your password." });
      }
      employee.password = await bcrypt.hash(password, SALT_ROUNDS);
      await employee.save();
      return res.json(toEmployeeDto(employee));
    }

    const isValid = await bcrypt.compare(password, employee.password);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json(toEmployeeDto(employee));
  } catch (error) {
    console.error("Employee login error:", error);
    res.status(500).json({ message: error.message || "Failed to login" });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const employee = await Employee.findOne({ email: email.toLowerCase() });
    if (!employee) {
      // Return generic response to avoid email enumeration
      return res.json({ message: "If an account exists for that email, a reset link has been sent." });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    employee.resetPasswordToken = hashedToken;
    employee.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await employee.save({ validateBeforeSave: false });

    const baseUrl = (process.env.APP_LOGIN_URL || "http://localhost:8080").replace(/\/$/, "");
    const resetUrl = `${baseUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(employee.email)}`;

    await sendPasswordResetEmail({
      to: employee.email,
      name: employee.name,
      resetUrl,
    });

    res.json({ message: "If an account exists for that email, a reset link has been sent." });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: error.message || "Failed to process request" });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { email, token, password } = req.body;
    if (!email || !token || !password) {
      return res.status(400).json({ message: "Email, token, and new password are required" });
    }

    if (password.trim().length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const employee = await Employee.findOne({
      email: email.toLowerCase(),
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select("+password +resetPasswordToken +resetPasswordExpires");

    if (!employee) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    employee.password = await bcrypt.hash(password.trim(), SALT_ROUNDS);
    employee.resetPasswordToken = undefined;
    employee.resetPasswordExpires = undefined;
    await employee.save();

    res.json({ message: "Password has been reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: error.message || "Failed to reset password" });
  }
});

export default router;

