import mongoose from "mongoose";

const holidaySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    day: { type: String, trim: true },
    type: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model("Holiday", holidaySchema);

