import { Router } from "express";
import Leave from "../models/Leave.js";
import User from "../models/User.js";
import { protect, allowRoles } from "../middleware/auth.js";

const router = Router();
router.use(protect);

router.post("/", async (req, res) => {
  try {
    const { leaveType, fromDate, toDate, reason } = req.body;
    if (!leaveType || !fromDate || !toDate || !reason) return res.status(400).json({ message: "Please fill in all leave fields." });
    if (toDate < fromDate) return res.status(400).json({ message: "End date cannot be before start date." });
    const leave = await Leave.create({ user: req.user._id, leaveType, fromDate, toDate, reason });
    res.status(201).json(await leave.populate("user", "name email department"));
  } catch {
    res.status(500).json({ message: "Could not submit leave request." });
  }
});

router.get("/mine", async (req, res) => {
  res.json(await Leave.find({ user: req.user._id }).sort({ createdAt: -1 }));
});

router.get("/", allowRoles("HR", "Manager"), async (req, res) => {
  const filter = {};
  if (req.user.role === "Manager") {
    const team = await User.find({ department: req.user.department }).select("_id");
    filter.user = { $in: team.map(u => u._id) };
  }
  res.json(await Leave.find(filter).populate("user", "name email department").sort({ createdAt: -1 }));
});

router.patch("/:id/status", allowRoles("HR", "Manager"), async (req, res) => {
  const { status } = req.body;
  if (!["Approved", "Rejected"].includes(status)) return res.status(400).json({ message: "Status must be Approved or Rejected." });
  const leave = await Leave.findById(req.params.id).populate("user", "department");
  if (!leave) return res.status(404).json({ message: "Leave request not found." });
  if (req.user.role === "Manager" && leave.user.department !== req.user.department) return res.status(403).json({ message: "You can only review your department's requests." });
  leave.status = status;
  leave.reviewedBy = req.user._id;
  await leave.save();
  res.json(leave);
});

export default router;
