import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: "" },
  start_time: { type: String, required: true },
  end_time: { type: String, required: true },
  hours_spent: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["pending", "completed"],
    default: "pending",
  },
  remarks: { type: String, trim: true, default: "" },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Client",
  },
  clientId: { type: String },
  typeOfWork: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TypeOfWork",
  },
  typeOfWorkId: { type: String },
  is_invoiced: { type: Boolean, default: false },
});

const dailyWorkSheetSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    employeeId: { type: String, required: true }, // Store employee ID for easier querying
    date: { type: Date, required: true },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
    },
    clientId: { type: String }, // Store client ID for easier querying
    typeOfWork: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TypeOfWork",
    },
    typeOfWorkId: { type: String }, // Store type of work ID for easier querying
    tasks: [taskSchema],
    worksheet_status: {
      type: String,
      enum: ["draft", "submitted", "approved", "rejected", "reopened"],
      default: "draft",
    },
    admin_comments: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

// Compound index to ensure one worksheet per employee per day
dailyWorkSheetSchema.index({ employeeId: 1, date: 1 }, { unique: true });

// Pre-save hook to calculate hours_spent for each task
dailyWorkSheetSchema.pre("save", function (next) {
  if (this.tasks && this.tasks.length > 0) {
    this.tasks.forEach((task) => {
      if (task.start_time && task.end_time) {
        const start = new Date(`2000-01-01 ${task.start_time}`);
        const end = new Date(`2000-01-01 ${task.end_time}`);
        
        // Handle case where end time is next day
        if (end < start) {
          end.setDate(end.getDate() + 1);
        }
        
        const diffMs = end - start;
        const diffHours = diffMs / (1000 * 60 * 60);
        task.hours_spent = Math.round(diffHours * 100) / 100; // Round to 2 decimal places
      }
    });
  }
  next();
});

export default mongoose.model("DailyWorkSheet", dailyWorkSheetSchema);

