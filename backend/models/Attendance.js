import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  dateKey: { type: String, required: true },
  status: { type: String, enum: ["Present"], default: "Present" },
  markedAt: { type: Date, default: Date.now }
}, { timestamps: true });

attendanceSchema.index({ user: 1, dateKey: 1 }, { unique: true });
export default mongoose.model("Attendance", attendanceSchema);
