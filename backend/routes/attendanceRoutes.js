import { Router } from "express";
import Attendance from "../models/Attendance.js";
import { protect, allowRoles } from "../middleware/auth.js";

const router = Router();
router.use(protect);

router.post("/mark", async (req, res) => {
  try {
    const dateKey = new Date().toISOString().slice(0, 10);
    const record = await Attendance.create({ user: req.user._id, dateKey });
    res.status(201).json(record);
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "Attendance is already marked for today." });
    res.status(500).json({ message: "Could not mark attendance." });
  }
});

router.get("/mine", async (req, res) => {
  const records = await Attendance.find({ user: req.user._id }).sort({ dateKey: -1 });
  res.json(records);
});

router.get("/", allowRoles("HR", "Manager"), async (req, res) => {
  const filter = {};
  if (req.user.role === "Manager") filter.user = { $in: (await (await import("../models/User.js")).default.find({ department: req.user.department }).select("_id")).map(u => u._id) };
  const records = await Attendance.find(filter).populate("user", "name email department").sort({ dateKey: -1 }).limit(200);
  res.json(records);
});

export default router;
