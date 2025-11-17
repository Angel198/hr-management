import express from "express";
import Holiday from "../models/Holiday.js";

const router = express.Router();

// GET all holidays
router.get("/", async (req, res) => {
  try {
    const holidays = await Holiday.find().sort({ date: 1 });
    res.json(holidays);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single holiday
router.get("/:id", async (req, res) => {
  try {
    const holiday = await Holiday.findById(req.params.id);
    if (!holiday) {
      return res.status(404).json({ message: "Holiday not found" });
    }
    res.json(holiday);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create holiday
router.post("/", async (req, res) => {
  try {
    const { name, date, type } = req.body;
    if (!name || !date || !type) {
      return res.status(400).json({ message: "Name, date, and type are required" });
    }

    const dateObj = new Date(date);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const day = days[dateObj.getDay()];

    const holiday = new Holiday({ name, date: dateObj, day, type });
    await holiday.save();
    res.status(201).json(holiday);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update holiday
router.put("/:id", async (req, res) => {
  try {
    const { name, date, type } = req.body;
    const updateData = { name, type };

    if (date) {
      const dateObj = new Date(date);
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      updateData.date = dateObj;
      updateData.day = days[dateObj.getDay()];
    }

    const holiday = await Holiday.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!holiday) {
      return res.status(404).json({ message: "Holiday not found" });
    }

    res.json(holiday);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE holiday
router.delete("/:id", async (req, res) => {
  try {
    const holiday = await Holiday.findByIdAndDelete(req.params.id);
    if (!holiday) {
      return res.status(404).json({ message: "Holiday not found" });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

