import mongoose from "mongoose";

const leaveRequestSchema = new mongoose.Schema(
  {
    requestId: { type: String, required: true, unique: true, trim: true },
    employeeId: { type: String, trim: true },
    type: {
      type: String,
      enum: ["Sick Leave", "Casual Leave", "Half-day Leave"],
      required: true,
    },
    from: { type: Date, required: true },
    to: { type: Date, required: true },
    days: { type: Number, required: true, min: 0.5 },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    approver: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model("LeaveRequest", leaveRequestSchema);


