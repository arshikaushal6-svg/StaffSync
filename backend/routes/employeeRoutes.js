import { Router } from "express";
import User from "../models/User.js";
import { protect, allowRoles } from "../middleware/auth.js";

const router = Router();
router.use(protect);

router.get("/", allowRoles("HR", "Manager"), async (req, res) => {
  const filter = req.user.role === "Manager" ? { department: req.user.department } : {};
  const employees = await User.find(filter).select("-password").sort({ name: 1 });
  res.json(employees);
});

router.put("/:id", allowRoles("HR"), async (req, res) => {
  try {
    const allowed = ["name", "email", "role", "department", "designation"];
    const updates = {};
    for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key];
    const employee = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select("-password");
    if (!employee) return res.status(404).json({ message: "Employee not found." });
    res.json(employee);
  } catch {
    res.status(400).json({ message: "Could not update employee. Check the values." });
  }
});

router.delete("/:id", allowRoles("HR"), async (req, res) => {
  if (req.params.id === String(req.user._id)) return res.status(400).json({ message: "You cannot delete your own account." });
  const employee = await User.findByIdAndDelete(req.params.id);
  if (!employee) return res.status(404).json({ message: "Employee not found." });
  res.json({ message: "Employee deleted." });
});

export default router;
