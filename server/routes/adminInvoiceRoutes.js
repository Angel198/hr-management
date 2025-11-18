import express from "express";
import {
  getTasksByClient,
  createInvoice,
  updateInvoice,
  finalizeInvoice,
  getInvoiceById,
  getInvoicesByClient,
} from "../controllers/adminInvoiceController.js";

const router = express.Router();

router.get("/tasks/client/:clientId", getTasksByClient);
router.post("/invoice/create", createInvoice);
router.put("/invoice/update/:invoiceId", updateInvoice);
router.post("/invoice/finalize/:invoiceId", finalizeInvoice);
router.get("/invoice/view/:invoiceId", getInvoiceById);
router.get("/invoice/client/:clientId", getInvoicesByClient);

export default router;


