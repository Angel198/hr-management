import express from "express";
import Event from "../models/Event.js";

const router = express.Router();

// GET all events
router.get("/", async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single event
router.get("/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create event
router.post("/", async (req, res) => {
  try {
    const { name, date, location, description, status } = req.body;
    if (!name || !date || !location) {
      return res.status(400).json({ message: "Name, date, and location are required" });
    }

    const event = new Event({
      name,
      date: new Date(date),
      location,
      description: description || "",
      status: status || "upcoming",
    });
    await event.save();
    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update event
router.put("/:id", async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.date) {
      updateData.date = new Date(updateData.date);
    }

    const event = await Event.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json(event);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE event
router.delete("/:id", async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

