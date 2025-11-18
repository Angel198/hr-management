import express from "express";
import bcrypt from "bcryptjs";
import Employee from "../models/Employee.js";
import { sendEmployeeCredentialsEmail } from "../utils/email.js";

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

router.get("/", async (_req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
    res.json(employees.map(toEmployeeDto));
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({ message: error.message || "Failed to fetch employees" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { password, ...rest } = req.body;

    if (!password || typeof password !== "string" || !password.trim()) {
      return res.status(400).json({ message: "Password is required" });
    }

    if (password.trim().length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const hashedPassword = await bcrypt.hash(password.trim(), SALT_ROUNDS);
    const employee = await Employee.create({
      ...rest,
      password: hashedPassword,
    });

    res.status(201).json(toEmployeeDto(employee));

    try {
      await sendEmployeeCredentialsEmail({
        to: rest.email,
        name: rest.name,
        employeeId: rest.id,
        password: password.trim(),
      });
    } catch (emailError) {
      console.error("Failed to send employee credentials email:", emailError);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (typeof updateData.password === "string") {
      const trimmed = updateData.password.trim();
      if (trimmed) {
        updateData.password = await bcrypt.hash(trimmed, SALT_ROUNDS);
      } else {
        delete updateData.password;
      }
    }

    const employee = await Employee.findOneAndUpdate({ id: req.params.id }, updateData, {
      new: true,
      runValidators: true,
    });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.json(toEmployeeDto(employee));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const employee = await Employee.findOne({ id: req.params.id });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.json(toEmployeeDto(employee));
  } catch (error) {
    console.error("Error fetching employee:", error);
    res.status(500).json({ message: error.message || "Failed to fetch employee" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const employee = await Employee.findOneAndDelete({ id: req.params.id });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;


