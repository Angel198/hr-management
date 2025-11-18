import DailyWorkSheet from "../models/DailyWorkSheet.js";
import Employee from "../models/Employee.js";
import Client from "../models/Client.js";
import TypeOfWork from "../models/TypeOfWork.js";

// Create or get today's worksheet
export const createOrGetWorksheet = async (req, res) => {
  try {
    const { employeeId, clientId, typeOfWorkId } = req.body;
    
    if (!employeeId) {
      return res.status(400).json({ message: "Employee ID is required" });
    }

    const employee = await Employee.findOne({ id: employeeId });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let worksheet = await DailyWorkSheet.findOne({
      employeeId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    }).populate("employee", "id name email department designation")
      .populate("client", "name code")
      .populate("typeOfWork", "name code category");

    if (!worksheet) {
      let client = null;
      let typeOfWork = null;
      
      if (clientId) {
        client = await Client.findOne({ code: clientId.toUpperCase() });
      }
      if (typeOfWorkId) {
        typeOfWork = await TypeOfWork.findOne({ code: typeOfWorkId.toUpperCase() });
      }

      worksheet = new DailyWorkSheet({
        employee: employee._id,
        employeeId,
        date: today,
        client: client?._id,
        clientId: client?.code,
        typeOfWork: typeOfWork?._id,
        typeOfWorkId: typeOfWork?.code,
        tasks: [],
        worksheet_status: "draft",
      });
      await worksheet.save();
      await worksheet.populate("employee", "id name email department designation")
        .populate("client", "name code")
        .populate("typeOfWork", "name code category");
    } else {
      // Update client and type of work if provided
      if (clientId || typeOfWorkId) {
        if (clientId) {
          const client = await Client.findOne({ code: clientId.toUpperCase() });
          if (client) {
            worksheet.client = client._id;
            worksheet.clientId = client.code;
          }
        }
        if (typeOfWorkId) {
          const typeOfWork = await TypeOfWork.findOne({ code: typeOfWorkId.toUpperCase() });
          if (typeOfWork) {
            worksheet.typeOfWork = typeOfWork._id;
            worksheet.typeOfWorkId = typeOfWork.code;
          }
        }
        await worksheet.save();
        await worksheet.populate("employee", "id name email department designation")
          .populate("client", "name code")
          .populate("typeOfWork", "name code category");
      }
    }

    res.json(worksheet);
  } catch (error) {
    console.error("Error creating/getting worksheet:", error);
    res.status(500).json({ message: error.message || "Failed to create/get worksheet" });
  }
};

// Add task to worksheet
export const addTask = async (req, res) => {
  try {
    const { worksheetId } = req.params;
    const { title, description, start_time, end_time, remarks, clientId, typeOfWorkId } = req.body;

    if (!title || !start_time || !end_time) {
      return res.status(400).json({ message: "Title, start time, and end time are required" });
    }

    const worksheet = await DailyWorkSheet.findById(worksheetId);
    if (!worksheet) {
      return res.status(404).json({ message: "Worksheet not found" });
    }

    if (worksheet.worksheet_status !== "draft" && worksheet.worksheet_status !== "reopened") {
      return res.status(400).json({ message: "Cannot add tasks to submitted worksheet" });
    }

    let client = null;
    let typeOfWork = null;

    if (clientId) {
      client = await Client.findOne({ code: clientId.toUpperCase() });
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
    }

    if (typeOfWorkId) {
      typeOfWork = await TypeOfWork.findOne({ code: typeOfWorkId.toUpperCase() });
      if (!typeOfWork) {
        return res.status(404).json({ message: "Type of work not found" });
      }
    }

    const newTask = {
      title,
      description: description || "",
      start_time,
      end_time,
      remarks: remarks || "",
      status: "pending",
      client: client?._id,
      clientId: client?.code,
      typeOfWork: typeOfWork?._id,
      typeOfWorkId: typeOfWork?.code,
    };

    // Calculate hours
    const start = new Date(`2000-01-01 ${start_time}`);
    const end = new Date(`2000-01-01 ${end_time}`);
    if (end < start) {
      end.setDate(end.getDate() + 1);
    }
    const diffMs = end - start;
    const diffHours = diffMs / (1000 * 60 * 60);
    newTask.hours_spent = Math.round(diffHours * 100) / 100;

    worksheet.tasks.push(newTask);
    await worksheet.save();
    await worksheet.populate("employee", "id name email department designation")
      .populate("client", "name code")
      .populate("typeOfWork", "name code category");
    
    // Populate task client and typeOfWork
    const lastTask = worksheet.tasks[worksheet.tasks.length - 1];
    if (lastTask.client) {
      await lastTask.populate("client", "name code");
    }
    if (lastTask.typeOfWork) {
      await lastTask.populate("typeOfWork", "name code category");
    }

    res.json(worksheet);
  } catch (error) {
    console.error("Error adding task:", error);
    res.status(500).json({ message: error.message || "Failed to add task" });
  }
};

// Update task
export const updateTask = async (req, res) => {
  try {
    const { worksheetId, taskId } = req.params;
    const { title, description, start_time, end_time, status, remarks, clientId, typeOfWorkId } = req.body;

    const worksheet = await DailyWorkSheet.findById(worksheetId);
    if (!worksheet) {
      return res.status(404).json({ message: "Worksheet not found" });
    }

    if (worksheet.worksheet_status !== "draft" && worksheet.worksheet_status !== "reopened") {
      return res.status(400).json({ message: "Cannot edit tasks in submitted worksheet" });
    }

    const task = worksheet.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (start_time) task.start_time = start_time;
    if (end_time) task.end_time = end_time;
    if (status) task.status = status;
    if (remarks !== undefined) task.remarks = remarks;

    // Update client
    if (clientId !== undefined) {
      if (clientId) {
        const client = await Client.findOne({ code: clientId.toUpperCase() });
        if (client) {
          task.client = client._id;
          task.clientId = client.code;
        } else {
          return res.status(404).json({ message: "Client not found" });
        }
      } else {
        task.client = null;
        task.clientId = undefined;
      }
    }

    // Update type of work
    if (typeOfWorkId !== undefined) {
      if (typeOfWorkId) {
        const typeOfWork = await TypeOfWork.findOne({ code: typeOfWorkId.toUpperCase() });
        if (typeOfWork) {
          task.typeOfWork = typeOfWork._id;
          task.typeOfWorkId = typeOfWork.code;
        } else {
          return res.status(404).json({ message: "Type of work not found" });
        }
      } else {
        task.typeOfWork = null;
        task.typeOfWorkId = undefined;
      }
    }

    // Recalculate hours
    if (start_time || end_time) {
      const start = new Date(`2000-01-01 ${task.start_time}`);
      const end = new Date(`2000-01-01 ${task.end_time}`);
      if (end < start) {
        end.setDate(end.getDate() + 1);
      }
      const diffMs = end - start;
      const diffHours = diffMs / (1000 * 60 * 60);
      task.hours_spent = Math.round(diffHours * 100) / 100;
    }

    await worksheet.save();
    await worksheet.populate("employee", "id name email department designation")
      .populate("client", "name code")
      .populate("typeOfWork", "name code category");
    
    // Populate task client and typeOfWork
    if (task.client) {
      await task.populate("client", "name code");
    }
    if (task.typeOfWork) {
      await task.populate("typeOfWork", "name code category");
    }

    res.json(worksheet);
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ message: error.message || "Failed to update task" });
  }
};

// Remove task
export const removeTask = async (req, res) => {
  try {
    const { worksheetId, taskId } = req.params;

    const worksheet = await DailyWorkSheet.findById(worksheetId);
    if (!worksheet) {
      return res.status(404).json({ message: "Worksheet not found" });
    }

    if (worksheet.worksheet_status !== "draft" && worksheet.worksheet_status !== "reopened") {
      return res.status(400).json({ message: "Cannot remove tasks from submitted worksheet" });
    }

    worksheet.tasks.id(taskId)?.remove();
    await worksheet.save();

    res.json(worksheet);
  } catch (error) {
    console.error("Error removing task:", error);
    res.status(500).json({ message: error.message || "Failed to remove task" });
  }
};

// Update worksheet client and type of work
export const updateWorksheetDetails = async (req, res) => {
  try {
    const { worksheetId } = req.params;
    const { clientId, typeOfWorkId } = req.body;

    const worksheet = await DailyWorkSheet.findById(worksheetId);
    if (!worksheet) {
      return res.status(404).json({ message: "Worksheet not found" });
    }

    if (worksheet.worksheet_status !== "draft" && worksheet.worksheet_status !== "reopened") {
      return res.status(400).json({ message: "Cannot update submitted worksheet" });
    }

    if (clientId !== undefined) {
      if (clientId) {
        const client = await Client.findOne({ code: clientId.toUpperCase() });
        if (client) {
          worksheet.client = client._id;
          worksheet.clientId = client.code;
        } else {
          return res.status(404).json({ message: "Client not found" });
        }
      } else {
        worksheet.client = null;
        worksheet.clientId = undefined;
      }
    }

    if (typeOfWorkId !== undefined) {
      if (typeOfWorkId) {
        const typeOfWork = await TypeOfWork.findOne({ code: typeOfWorkId.toUpperCase() });
        if (typeOfWork) {
          worksheet.typeOfWork = typeOfWork._id;
          worksheet.typeOfWorkId = typeOfWork.code;
        } else {
          return res.status(404).json({ message: "Type of work not found" });
        }
      } else {
        worksheet.typeOfWork = null;
        worksheet.typeOfWorkId = undefined;
      }
    }

    await worksheet.save();
    await worksheet.populate("employee", "id name email department designation")
      .populate("client", "name code")
      .populate("typeOfWork", "name code category");

    res.json(worksheet);
  } catch (error) {
    console.error("Error updating worksheet details:", error);
    res.status(500).json({ message: error.message || "Failed to update worksheet" });
  }
};

// Submit worksheet
export const submitWorksheet = async (req, res) => {
  try {
    const { worksheetId } = req.params;

    const worksheet = await DailyWorkSheet.findById(worksheetId);
    if (!worksheet) {
      return res.status(404).json({ message: "Worksheet not found" });
    }

    if (worksheet.worksheet_status !== "draft" && worksheet.worksheet_status !== "reopened") {
      return res.status(400).json({ message: "Worksheet is already submitted" });
    }

    if (worksheet.tasks.length === 0) {
      return res.status(400).json({ message: "Cannot submit empty worksheet" });
    }

    worksheet.worksheet_status = "submitted";
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
    console.error("Error submitting worksheet:", error);
    res.status(500).json({ message: error.message || "Failed to submit worksheet" });
  }
};

// Get my worksheets
export const getMyWorksheets = async (req, res) => {
  try {
    const { employeeId } = req.query;

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
    console.error("Error fetching worksheets:", error);
    res.status(500).json({ message: error.message || "Failed to fetch worksheets" });
  }
};

// Get worksheet by date
export const getWorksheetByDate = async (req, res) => {
  try {
    const { employeeId, date } = req.query;

    if (!employeeId || !date) {
      return res.status(400).json({ message: "Employee ID and date are required" });
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const worksheet = await DailyWorkSheet.findOne({
      employeeId,
      date: {
        $gte: targetDate,
        $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000),
      },
    }).populate("employee", "id name email department designation")
      .populate("client", "name code")
      .populate("typeOfWork", "name code category");

    if (!worksheet) {
      return res.status(404).json({ message: "Worksheet not found for this date" });
    }

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
    console.error("Error fetching worksheet by date:", error);
    res.status(500).json({ message: error.message || "Failed to fetch worksheet" });
  }
};

