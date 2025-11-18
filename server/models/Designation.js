import mongoose from "mongoose";

const designationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    department: { type: String, trim: true, default: "General" },
  },
  { timestamps: true }
);

export default mongoose.model("Designation", designationSchema);


