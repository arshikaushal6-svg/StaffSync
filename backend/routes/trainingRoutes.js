import { Router } from "express";
import Training from "../models/Training.js";
import { protect, allowRoles } from "../middleware/auth.js";

const router = Router();
router.use(protect);

router.get("/", async (_req, res) => {
  res.json(await Training.find().populate("createdBy", "name").sort({ date: 1 }));
});

router.post("/", allowRoles("HR", "Manager"), async (req, res) => {
  const { title, description, date } = req.body;
  if (!title || !description || !date) return res.status(400).json({ message: "All training fields are required." });
  res.status(201).json(await Training.create({ title, description, date, createdBy: req.user._id }));
});

router.delete("/:id", allowRoles("HR", "Manager"), async (req, res) => {
  const item = await Training.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: "Training program not found." });
  res.json({ message: "Training program deleted." });
});

export default router;
