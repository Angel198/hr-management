import express from "express";
import LeaveRequest from "../models/LeaveRequest.js";
import mongoose from "mongoose";

const router = express.Router();

const toLeaveDto = (leave) => ({
  id: leave.requestId,
  type: leave.type,
  from: leave.from,
  to: leave.to,
  days: leave.days,
  status: leave.status,
  approver: leave.approver,
  notes: leave.notes,
  createdAt: leave.createdAt,
  updatedAt: leave.updatedAt,
});

router.get("/", async (_req, res) => {
  try {
    const leaves = await LeaveRequest.find().sort({ createdAt: -1 });
    res.json(leaves.map(toLeaveDto));
  } catch (error) {
    console.error("Error fetching leaves:", error);
    res.status(500).json({ message: error.message || "Failed to fetch leave requests" });
  }
});

router.post("/", async (req, res) => {
  try {
    const payload = {
      ...req.body,
      requestId: req.body.requestId ?? req.body.id ?? new mongoose.Types.ObjectId().toString(),
    };
    const leave = await LeaveRequest.create(payload);
    res.status(201).json(toLeaveDto(leave));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const leave = await LeaveRequest.findOneAndUpdate({ requestId: req.params.id }, req.body, {
      new: true,
      runValidators: true,
    });
    if (!leave) {
      return res.status(404).json({ message: "Leave request not found" });
    }
    res.json(toLeaveDto(leave));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const leave = await LeaveRequest.findOneAndDelete({ requestId: req.params.id });
    if (!leave) {
      return res.status(404).json({ message: "Leave request not found" });
    }
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PATCH approve leave request
router.patch("/:id/approve", async (req, res) => {
  try {
    const { approver } = req.body;
    const leave = await LeaveRequest.findOneAndUpdate(
      { requestId: req.params.id },
      { status: "Approved", approver: approver || "Admin" },
      { new: true, runValidators: true }
    );
    if (!leave) {
      return res.status(404).json({ message: "Leave request not found" });
    }
    res.json(toLeaveDto(leave));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PATCH reject leave request
router.patch("/:id/reject", async (req, res) => {
  try {
    const { approver } = req.body;
    const leave = await LeaveRequest.findOneAndUpdate(
      { requestId: req.params.id },
      { status: "Rejected", approver: approver || "Admin" },
      { new: true, runValidators: true }
    );
    if (!leave) {
      return res.status(404).json({ message: "Leave request not found" });
    }
    res.json(toLeaveDto(leave));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;


