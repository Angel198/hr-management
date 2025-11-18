import express from "express";
import Designation from "../models/Designation.js";

const router = express.Router();

const toDesignationDto = (designation) => ({
  id: designation._id.toString(),
  name: designation.name,
  department: designation.department,
  createdAt: designation.createdAt,
  updatedAt: designation.updatedAt,
});

router.get("/", async (_req, res) => {
  try {
    const designations = await Designation.find().sort({ createdAt: -1 });
    res.json(designations.map(toDesignationDto));
  } catch (error) {
    console.error("Error fetching designations:", error);
    res.status(500).json({ message: error.message || "Failed to fetch designations" });
  }
});

router.post("/", async (req, res) => {
  try {
    const designation = await Designation.create(req.body);
    res.status(201).json(toDesignationDto(designation));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const designation = await Designation.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!designation) {
      return res.status(404).json({ message: "Designation not found" });
    }
    res.json(toDesignationDto(designation));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const designation = await Designation.findByIdAndDelete(req.params.id);
    if (!designation) {
      return res.status(404).json({ message: "Designation not found" });
    }
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;


