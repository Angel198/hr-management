import mongoose from "mongoose";
import DailyWorkSheet from "../models/DailyWorkSheet.js";
import Client from "../models/Client.js";
import Invoice from "../models/Invoice.js";

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const ensureClientMatch = (task, client) => {
  if (!client) {
    return false;
  }
  const clientId = client._id?.toString();
  const clientCode = client.code || client.clientId || clientId;
  const taskClientId = task.client ? task.client.toString() : task.clientId;
  return taskClientId ? taskClientId === clientId || taskClientId === clientCode : false;
};

export const getTasksByClient = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { startDate, endDate, employeeId, status } = req.query;

    if (!clientId || !isObjectId(clientId)) {
      return res.status(400).json({ message: "Valid client ID is required" });
    }

    const worksheetFilter = {};
    if (employeeId && employeeId !== "all") {
      worksheetFilter.employeeId = employeeId;
    }
    if (status && status !== "all") {
      worksheetFilter.worksheet_status = status;
    }
    if (startDate && endDate) {
      worksheetFilter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (startDate) {
      worksheetFilter.date = { $gte: new Date(startDate) };
    } else if (endDate) {
      worksheetFilter.date = { $lte: new Date(endDate) };
    }

    const worksheets = await DailyWorkSheet.find(worksheetFilter)
      .populate("employee", "id name email")
      .populate("tasks.client", "name code");

    const tasks = [];
    worksheets.forEach((worksheet) => {
      worksheet.tasks.forEach((task) => {
        if (task.is_invoiced) {
          return;
        }
        if (!task.client && !task.clientId) {
          return;
        }
        const matchesClient =
          (task.client && task.client.toString() === clientId) || task.clientId === clientId;
        if (!matchesClient) {
          return;
        }
        tasks.push({
          worksheetId: worksheet._id,
          taskId: task._id,
          employeeId: worksheet.employeeId,
          employeeName: worksheet.employee?.name || worksheet.employeeId,
          date: worksheet.date,
          title: task.title,
          description: task.description,
          remarks: task.remarks,
          status: worksheet.worksheet_status,
          hours_spent: task.hours_spent,
        });
      });
    });

    res.json(tasks);
  } catch (error) {
    console.error("getTasksByClient error:", error);
    res.status(500).json({ message: error.message || "Failed to fetch tasks" });
  }
};

export const createInvoice = async (req, res) => {
  try {
    const { client_id, task_ids = [] } = req.body;
    if (!client_id || !Array.isArray(task_ids) || task_ids.length === 0) {
      return res.status(400).json({ message: "Client ID and task_ids are required" });
    }

    if (!isObjectId(client_id)) {
      return res.status(400).json({ message: "Invalid client ID" });
    }

    const client = await Client.findById(client_id);
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    const invoiceTasks = [];
    for (const ref of task_ids) {
      const { worksheetId, taskId } = ref;
      if (!worksheetId || !taskId) {
        return res.status(400).json({ message: "Each task reference must include worksheetId and taskId" });
      }

      const worksheet = await DailyWorkSheet.findById(worksheetId).populate("employee", "id name");
      if (!worksheet) {
        return res.status(404).json({ message: "Worksheet not found" });
      }

      const task = worksheet.tasks.id(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      if (task.is_invoiced) {
        return res.status(400).json({ message: "Task already invoiced" });
      }
      const taskClientMatches =
        (task.client && task.client.toString() === client._id.toString()) ||
        task.clientId === client._id.toString() ||
        task.clientId === client.code;
      if (!taskClientMatches) {
        return res.status(400).json({ message: "All tasks must belong to the same client" });
      }

      invoiceTasks.push({
        worksheet: worksheet._id,
        task: task._id,
        employee: worksheet.employee?._id || null,
        employeeId: worksheet.employeeId,
        employeeName: worksheet.employee?.name || worksheet.employeeId,
        title: task.title,
        description: task.description,
        hours_spent: task.hours_spent,
        rate: 0,
        amount: 0,
        remarks: task.remarks,
      });
    }

    const invoice = await Invoice.create({
      client: client._id,
      clientId: client.code || client._id.toString(),
      clientName: client.name,
      tasks: invoiceTasks,
      subtotal: 0,
      tax: 0,
      total: 0,
      notes: "",
    });

    res.status(201).json(invoice);
  } catch (error) {
    console.error("createInvoice error:", error);
    res.status(500).json({ message: error.message || "Failed to create invoice" });
  }
};

export const getInvoiceById = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const invoice = await Invoice.findById(invoiceId)
      .populate("client", "name code")
      .populate("tasks.employee", "name id");
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    res.json(invoice);
  } catch (error) {
    console.error("getInvoiceById error:", error);
    res.status(500).json({ message: error.message || "Failed to load invoice" });
  }
};

export const getInvoicesByClient = async (req, res) => {
  try {
    const { clientId } = req.params;
    if (!clientId || !isObjectId(clientId)) {
      return res.status(400).json({ message: "Valid client ID is required" });
    }

    const invoices = await Invoice.find({ client: clientId }).sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error) {
    console.error("getInvoicesByClient error:", error);
    res.status(500).json({ message: error.message || "Failed to load invoices" });
  }
};

const recalcTotals = (invoice) => {
  invoice.subtotal = invoice.tasks.reduce((sum, task) => {
    const amount = task.rate * task.hours_spent;
    task.amount = Number.isFinite(amount) ? Math.round(amount * 100) / 100 : 0;
    return sum + task.amount;
  }, 0);
  invoice.total = invoice.subtotal + (invoice.tax || 0);
};

export const updateInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { tasks = [], tax, notes } = req.body;

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    if (invoice.invoice_status === "final") {
      return res.status(400).json({ message: "Final invoices cannot be edited" });
    }

    if (Array.isArray(tasks) && tasks.length > 0) {
      invoice.tasks = tasks.map((task) => ({
        worksheet: task.worksheet,
        task: task.task,
        employee: task.employee,
        employeeId: task.employeeId,
        employeeName: task.employeeName,
        title: task.title,
        description: task.description,
        hours_spent: task.hours_spent,
        rate: task.rate,
        amount: task.amount || 0,
        remarks: task.remarks || "",
        _id: task._id,
      }));
    }

    if (typeof tax === "number") {
      invoice.tax = tax;
    }
    if (typeof notes === "string") {
      invoice.notes = notes;
    }

    recalcTotals(invoice);
    await invoice.save();
    res.json(invoice);
  } catch (error) {
    console.error("updateInvoice error:", error);
    res.status(500).json({ message: error.message || "Failed to update invoice" });
  }
};

export const finalizeInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    if (invoice.invoice_status === "final") {
      return res.status(400).json({ message: "Invoice already finalized" });
    }

    invoice.invoice_status = "final";
    recalcTotals(invoice);
    await invoice.save();

    // Mark tasks as invoiced
    for (const task of invoice.tasks) {
      await DailyWorkSheet.updateOne(
        { _id: task.worksheet, "tasks._id": task.task },
        { $set: { "tasks.$.is_invoiced": true } },
      );
    }

    res.json(invoice);
  } catch (error) {
    console.error("finalizeInvoice error:", error);
    res.status(500).json({ message: error.message || "Failed to finalize invoice" });
  }
};


