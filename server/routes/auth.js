import express from "express";
import bcrypt from "bcryptjs";
import Employee from "../models/Employee.js";

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

export default router;

