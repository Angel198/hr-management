import express from "express";
import Attendance from "../models/Attendance.js";

const router = express.Router();

// GET all attendance records
router.get("/", async (req, res) => {
  try {
    const { employeeId, date, startDate, endDate } = req.query;
    const query = {};

    if (employeeId) {
      query.employeeId = employeeId;
    }

    if (date) {
      const dateObj = new Date(date);
      const start = new Date(dateObj.setHours(0, 0, 0, 0));
      const end = new Date(dateObj.setHours(23, 59, 59, 999));
      query.date = { $gte: start, $lte: end };
    } else if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const attendance = await Attendance.find(query).sort({ date: -1 });
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET today's attendance for an employee (must come before /:id)
router.get("/today/:employeeId", async (req, res) => {
  try {
    const { employeeId } = req.params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const attendance = await Attendance.findOne({
      employeeId,
      date: { $gte: today, $lte: endOfDay },
    });

    if (!attendance) {
      return res.json(null);
    }

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single attendance record
router.get("/:id", async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create attendance record
router.post("/", async (req, res) => {
  try {
    const { employeeId, date, checkIn, checkOut, workHours, status, location } = req.body;
    if (!employeeId || !date) {
      return res.status(400).json({ message: "Employee ID and date are required" });
    }

    const attendance = new Attendance({
      employeeId,
      date: new Date(date),
      checkIn: checkIn || "",
      checkOut: checkOut || "",
      workHours: workHours || "",
      status: status || "Present",
      location: location || "",
    });
    await attendance.save();
    res.status(201).json(attendance);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Attendance record already exists for this employee and date" });
    }
    res.status(400).json({ message: error.message });
  }
});

// PUT update attendance record
router.put("/:id", async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.date) {
      updateData.date = new Date(updateData.date);
    }

    const attendance = await Attendance.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    res.json(attendance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE attendance record
router.delete("/:id", async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndDelete(req.params.id);
    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST check-in
router.post("/checkin", async (req, res) => {
  try {
    const { employeeId, location } = req.body;
    if (!employeeId) {
      return res.status(400).json({ message: "Employee ID is required" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Check if attendance record exists for today
    let attendance = await Attendance.findOne({
      employeeId,
      date: { $gte: today, $lte: endOfDay },
    });

    const now = new Date();
    const checkInTime = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    // Determine status based on check-in time (9:00 AM is considered on time)
    const expectedCheckIn = new Date(now);
    expectedCheckIn.setHours(9, 0, 0, 0);
    const status = now > expectedCheckIn ? "Late" : "On Time";

    if (attendance) {
      // Update existing record
      if (attendance.checkIn) {
        return res.status(400).json({ message: "Already checked in today" });
      }
      attendance.checkIn = checkInTime;
      attendance.status = status;
      if (location) attendance.location = location;
      await attendance.save();
    } else {
      // Create new record
      attendance = new Attendance({
        employeeId,
        date: today,
        checkIn: checkInTime,
        checkOut: "",
        workHours: "",
        status,
        location: location || "",
      });
      await attendance.save();
    }

    res.json(attendance);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Attendance record already exists for today" });
    }
    res.status(400).json({ message: error.message });
  }
});

// POST check-out
router.post("/checkout", async (req, res) => {
  try {
    const { employeeId } = req.body;
    if (!employeeId) {
      return res.status(400).json({ message: "Employee ID is required" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Find today's attendance record
    const attendance = await Attendance.findOne({
      employeeId,
      date: { $gte: today, $lte: endOfDay },
    });

    if (!attendance) {
      return res.status(404).json({ message: "No check-in found for today. Please check in first." });
    }

    if (!attendance.checkIn) {
      return res.status(400).json({ message: "Please check in first" });
    }

    if (attendance.checkOut) {
      return res.status(400).json({ message: "Already checked out today" });
    }

    const now = new Date();
    const checkOutTime = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    // Calculate work hours
    // Parse check-in time (format: "09:00 AM" or "9:00 AM")
    const checkInParts = attendance.checkIn.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!checkInParts) {
      return res.status(400).json({ message: "Invalid check-in time format" });
    }
    
    let checkInHour = parseInt(checkInParts[1], 10);
    const checkInMinute = parseInt(checkInParts[2], 10);
    const checkInPeriod = checkInParts[3].toUpperCase();
    
    if (checkInPeriod === "PM" && checkInHour !== 12) {
      checkInHour += 12;
    } else if (checkInPeriod === "AM" && checkInHour === 12) {
      checkInHour = 0;
    }

    const checkOutParts = checkOutTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!checkOutParts) {
      return res.status(400).json({ message: "Invalid check-out time format" });
    }
    
    let checkOutHour = parseInt(checkOutParts[1], 10);
    const checkOutMinute = parseInt(checkOutParts[2], 10);
    const checkOutPeriod = checkOutParts[3].toUpperCase();
    
    if (checkOutPeriod === "PM" && checkOutHour !== 12) {
      checkOutHour += 12;
    } else if (checkOutPeriod === "AM" && checkOutHour === 12) {
      checkOutHour = 0;
    }

    const checkInTotalMinutes = checkInHour * 60 + checkInMinute;
    const checkOutTotalMinutes = checkOutHour * 60 + checkOutMinute;
    const diffMinutes = checkOutTotalMinutes - checkInTotalMinutes;
    
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    const workHours = `${hours}h ${minutes.toString().padStart(2, "0")}m`;

    attendance.checkOut = checkOutTime;
    attendance.workHours = workHours;
    if (attendance.status === "Absent") {
      attendance.status = "Present";
    }
    await attendance.save();

    res.json(attendance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;

