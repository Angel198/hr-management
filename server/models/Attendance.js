import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    checkIn: { type: String, trim: true },
    checkOut: { type: String, trim: true },
    workHours: { type: String, trim: true },
    status: {
      type: String,
      enum: ["Present", "On Time", "Late", "Absent", "On Leave"],
      default: "Present",
    },
    location: { type: String, trim: true },
  },
  { timestamps: true }
);

attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

export default mongoose.model("Attendance", attendanceSchema);

