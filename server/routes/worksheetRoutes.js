import express from "express";
import {
  createOrGetWorksheet,
  addTask,
  updateTask,
  removeTask,
  updateWorksheetDetails,
  submitWorksheet,
  getMyWorksheets,
  getWorksheetByDate,
} from "../controllers/worksheetController.js";

const router = express.Router();

// Create or get today's worksheet
router.post("/create", createOrGetWorksheet);

// Add task to worksheet
router.post("/add-task/:worksheetId", addTask);

// Update task
router.put("/update-task/:worksheetId/:taskId", updateTask);

// Remove task
router.delete("/remove-task/:worksheetId/:taskId", removeTask);

// Update worksheet details (client and type of work)
router.put("/update/:worksheetId", updateWorksheetDetails);

// Submit worksheet
router.post("/submit/:worksheetId", submitWorksheet);

// Get my worksheets
router.get("/my", getMyWorksheets);

// Get worksheet by date
router.get("/my/:date", getWorksheetByDate);

export default router;

