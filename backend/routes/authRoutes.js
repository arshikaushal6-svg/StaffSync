import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";

const router = Router();

function makeToken(user) {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
}

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, department, designation } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "Name, email and password are required." });
    if (password.length < 6) return res.status(400).json({ message: "Password must contain at least 6 characters." });
    const normalizedEmail = email.toLowerCase().trim();
    if (await User.findOne({ email: normalizedEmail })) return res.status(409).json({ message: "Email is already registered." });

    // Educational demo only: public role selection should be removed for production.
    const safeRole = ["HR", "Manager", "Employee"].includes(role) ? role : "Employee";
    const user = await User.create({
      name, email: normalizedEmail, password: await bcrypt.hash(password, 10),
      role: safeRole, department: department || "General", designation: designation || "Employee"
    });
    res.status(201).json({ token: makeToken(user), user: { id: user._id, name: user.name, email: user.email, role: user.role, department: user.department, designation: user.designation } });
  } catch (error) {
    res.status(500).json({ message: "Could not register user." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase().trim() });
    if (!user || !(await bcrypt.compare(password || "", user.password))) {
      return res.status(401).json({ message: "Incorrect email or password." });
    }
    res.json({ token: makeToken(user), user: { id: user._id, name: user.name, email: user.email, role: user.role, department: user.department, designation: user.designation } });
  } catch {
    res.status(500).json({ message: "Could not log in." });
  }
});

router.get("/me", protect, (req, res) => res.json({ user: req.user }));

export default router;
