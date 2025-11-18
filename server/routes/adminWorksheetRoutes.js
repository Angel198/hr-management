import express from "express";
import {
  getAllWorksheets,
  getWorksheetsByEmployee,
  approveWorksheet,
  rejectWorksheet,
  reopenWorksheet,
  getWorksheetStats,
} from "../controllers/adminWorksheetController.js";

const router = express.Router();

// Get all worksheets with filters
router.get("/all", getAllWorksheets);

// Get worksheets by employee
router.get("/:employeeId", getWorksheetsByEmployee);

// Approve worksheet
router.put("/approve/:worksheetId", approveWorksheet);

// Reject worksheet
router.put("/reject/:worksheetId", rejectWorksheet);

// Reopen worksheet
router.put("/reopen/:worksheetId", reopenWorksheet);

// Get dashboard stats
router.get("/stats/summary", getWorksheetStats);

export default router;

