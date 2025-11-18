import mongoose from "mongoose";

const typeOfWorkSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    description: { type: String, trim: true },
    category: {
      type: String,
      enum: ["Development", "Design", "Testing", "Support", "Consulting", "Other"],
      default: "Other",
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model("TypeOfWork", typeOfWorkSchema);

