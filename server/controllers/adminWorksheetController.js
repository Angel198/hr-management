import DailyWorkSheet from "../models/DailyWorkSheet.js";
import Employee from "../models/Employee.js";

// Get all worksheets with filters
export const getAllWorksheets = async (req, res) => {
  try {
    const { date, employeeId, status, startDate, endDate, clientId, typeOfWorkId } = req.query;

    const query = {};

    if (employeeId) {
      query.employeeId = employeeId;
    }

    if (status) {
      query.worksheet_status = status;
    }

    if (date) {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      query.date = {
        $gte: targetDate,
        $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000),
      };
    } else if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }

    // Note: clientId and typeOfWorkId filters are handled client-side
    // because they can be at both worksheet and task levels

    const worksheets = await DailyWorkSheet.find(query)
      .populate("employee", "id name email department designation")
      .populate("client", "name code")
      .populate("typeOfWork", "name code category")
      .sort({ date: -1, createdAt: -1 });

    // Populate task client and typeOfWork for each worksheet
    for (const worksheet of worksheets) {
      if (worksheet.tasks && worksheet.tasks.length > 0) {
        for (const task of worksheet.tasks) {
          if (task.client) {
            await task.populate("client", "name code");
          }
          if (task.typeOfWork) {
            await task.populate("typeOfWork", "name code category");
          }
        }
      }
    }

    res.json(worksheets);
  } catch (error) {
    console.error("Error fetching all worksheets:", error);
    res.status(500).json({ message: error.message || "Failed to fetch worksheets" });
  }
};

// Get worksheets by employee
export const getWorksheetsByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;

    if (!employeeId) {
      return res.status(400).json({ message: "Employee ID is required" });
    }

    const worksheets = await DailyWorkSheet.find({ employeeId })
      .populate("employee", "id name email department designation")
      .populate("client", "name code")
      .populate("typeOfWork", "name code category")
      .sort({ date: -1 });

    // Populate task client and typeOfWork for each worksheet
    for (const worksheet of worksheets) {
      if (worksheet.tasks && worksheet.tasks.length > 0) {
        for (const task of worksheet.tasks) {
          if (task.client) {
            await task.populate("client", "name code");
          }
          if (task.typeOfWork) {
            await task.populate("typeOfWork", "name code category");
          }
        }
      }
    }

    res.json(worksheets);
  } catch (error) {
    console.error("Error fetching employee worksheets:", error);
    res.status(500).json({ message: error.message || "Failed to fetch worksheets" });
  }
};

// Approve worksheet
export const approveWorksheet = async (req, res) => {
  try {
    const { worksheetId } = req.params;
    const { admin_comments } = req.body;

    const worksheet = await DailyWorkSheet.findById(worksheetId);
    if (!worksheet) {
      return res.status(404).json({ message: "Worksheet not found" });
    }

    if (worksheet.worksheet_status !== "submitted" && worksheet.worksheet_status !== "reopened") {
      return res.status(400).json({ message: "Only submitted or reopened worksheets can be approved" });
    }

    worksheet.worksheet_status = "approved";
    if (admin_comments) {
      worksheet.admin_comments = admin_comments;
    }
    await worksheet.save();
    await worksheet.populate("employee", "id name email department designation")
      .populate("client", "name code")
      .populate("typeOfWork", "name code category");

    // Populate task client and typeOfWork
    if (worksheet.tasks && worksheet.tasks.length > 0) {
      for (const task of worksheet.tasks) {
        if (task.client) {
          await task.populate("client", "name code");
        }
        if (task.typeOfWork) {
          await task.populate("typeOfWork", "name code category");
        }
      }
    }

    res.json(worksheet);
  } catch (error) {
    console.error("Error approving worksheet:", error);
    res.status(500).json({ message: error.message || "Failed to approve worksheet" });
  }
};

// Reject worksheet
export const rejectWorksheet = async (req, res) => {
  try {
    const { worksheetId } = req.params;
    const { admin_comments } = req.body;

    if (!admin_comments || !admin_comments.trim()) {
      return res.status(400).json({ message: "Admin comments are required for rejection" });
    }

    const worksheet = await DailyWorkSheet.findById(worksheetId);
    if (!worksheet) {
      return res.status(404).json({ message: "Worksheet not found" });
    }

    if (worksheet.worksheet_status !== "submitted" && worksheet.worksheet_status !== "reopened") {
      return res.status(400).json({ message: "Only submitted or reopened worksheets can be rejected" });
    }

    worksheet.worksheet_status = "rejected";
    worksheet.admin_comments = admin_comments.trim();
    await worksheet.save();
    await worksheet.populate("employee", "id name email department designation")
      .populate("client", "name code")
      .populate("typeOfWork", "name code category");

    // Populate task client and typeOfWork
    if (worksheet.tasks && worksheet.tasks.length > 0) {
      for (const task of worksheet.tasks) {
        if (task.client) {
          await task.populate("client", "name code");
        }
        if (task.typeOfWork) {
          await task.populate("typeOfWork", "name code category");
        }
      }
    }

    res.json(worksheet);
  } catch (error) {
    console.error("Error rejecting worksheet:", error);
    res.status(500).json({ message: error.message || "Failed to reject worksheet" });
  }
};

// Reopen worksheet
export const reopenWorksheet = async (req, res) => {
  try {
    const { worksheetId } = req.params;
    const { admin_comments } = req.body;

    const worksheet = await DailyWorkSheet.findById(worksheetId);
    if (!worksheet) {
      return res.status(404).json({ message: "Worksheet not found" });
    }

    if (worksheet.worksheet_status !== "approved" && worksheet.worksheet_status !== "rejected") {
      return res.status(400).json({ message: "Only approved or rejected worksheets can be reopened" });
    }

    worksheet.worksheet_status = "reopened";
    if (admin_comments) {
      worksheet.admin_comments = admin_comments;
    }
    await worksheet.save();
    await worksheet.populate("employee", "id name email department designation")
      .populate("client", "name code")
      .populate("typeOfWork", "name code category");

    // Populate task client and typeOfWork
    if (worksheet.tasks && worksheet.tasks.length > 0) {
      for (const task of worksheet.tasks) {
        if (task.client) {
          await task.populate("client", "name code");
        }
        if (task.typeOfWork) {
          await task.populate("typeOfWork", "name code category");
        }
      }
    }

    res.json(worksheet);
  } catch (error) {
    console.error("Error reopening worksheet:", error);
    res.status(500).json({ message: error.message || "Failed to reopen worksheet" });
  }
};

// Get dashboard stats
export const getWorksheetStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalToday,
      pendingApprovals,
      approvedCount,
      rejectedCount,
    ] = await Promise.all([
      DailyWorkSheet.countDocuments({
        date: { $gte: today, $lt: tomorrow },
      }),
      DailyWorkSheet.countDocuments({
        worksheet_status: "submitted",
      }),
      DailyWorkSheet.countDocuments({
        worksheet_status: "approved",
      }),
      DailyWorkSheet.countDocuments({
        worksheet_status: "rejected",
      }),
    ]);

    res.json({
      totalToday,
      pendingApprovals,
      approvedCount,
      rejectedCount,
    });
  } catch (error) {
    console.error("Error fetching worksheet stats:", error);
    res.status(500).json({ message: error.message || "Failed to fetch stats" });
  }
};

