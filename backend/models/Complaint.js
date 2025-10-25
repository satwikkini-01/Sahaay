import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema(
  {
    citizen: { type: mongoose.Schema.Types.ObjectId, ref: "Citizen", required: true },
    department: {
      pgDeptId: Number,
      name: String,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    status: {
      type: String,
      enum: ["pending", "in-progress", "resolved", "escalated"],
      default: "pending",
    },
    slaHours: { type: Number, default: 48 },
    escalationLevel: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Complaint", complaintSchema);
