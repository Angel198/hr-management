import mongoose from "mongoose";

const invoiceTaskSchema = new mongoose.Schema(
  {
    worksheet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DailyWorkSheet",
      required: true,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    employeeId: { type: String, required: true },
    employeeName: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    hours_spent: { type: Number, default: 0 },
    rate: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
    remarks: { type: String, default: "" },
  },
  { _id: true },
);

const invoiceSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    clientId: { type: String },
    clientName: { type: String },
    tasks: [invoiceTaskSchema],
    subtotal: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    notes: { type: String, default: "" },
    invoice_status: {
      type: String,
      enum: ["draft", "final"],
      default: "draft",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Invoice", invoiceSchema);


