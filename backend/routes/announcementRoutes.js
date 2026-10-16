import { Router } from "express";
import Announcement from "../models/Announcement.js";
import { protect, allowRoles } from "../middleware/auth.js";

const router = Router();
router.use(protect);

router.get("/", async (_req, res) => {
  res.json(await Announcement.find().populate("createdBy", "name").sort({ createdAt: -1 }));
});

router.post("/", allowRoles("HR"), async (req, res) => {
  const { title, message } = req.body;
  if (!title || !message) return res.status(400).json({ message: "Title and message are required." });
  res.status(201).json(await Announcement.create({ title, message, createdBy: req.user._id }));
});

router.delete("/:id", allowRoles("HR"), async (req, res) => {
  const item = await Announcement.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: "Announcement not found." });
  res.json({ message: "Announcement deleted." });
});

export default router;
