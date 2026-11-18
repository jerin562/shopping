const express = require("express");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const { User } = require("../models");
const { asyncHandler, authenticate } = require("../middleware");

const router = express.Router();
const credentials = z.object({
  email: z.string().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128)
});

function issueToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

router.post("/register", asyncHandler(async (req, res) => {
  const parsed = z.object({ name: z.string().trim().min(1).max(100), email: credentials.shape.email, password: credentials.shape.password }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Enter a name, valid email, and password with at least 8 characters.", errors: parsed.error.flatten().fieldErrors });
  const exists = await User.exists({ email: parsed.data.email });
  if (exists) return res.status(409).json({ message: "An account with that email already exists." });
  const user = await User.create(parsed.data);
  res.status(201).json({ token: issueToken(user), user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}));

router.post("/login", asyncHandler(async (req, res) => {
  const parsed = credentials.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Enter a valid email and password." });
  const user = await User.findOne({ email: parsed.data.email }).select("+password");
  if (!user || !(await user.comparePassword(parsed.data.password))) return res.status(401).json({ message: "Email or password is incorrect." });
  res.json({ token: issueToken(user), user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}));

router.post("/logout", authenticate, (_req, res) => res.json({ message: "Signed out. Clear the session token in the client." }));

router.post("/forgot-password", (_req, res) => {
  res.status(503).json({ message: "Password reset email is not configured for this store yet. Please contact support." });
});

router.get("/me", authenticate, asyncHandler(async (req, res) => {
  const user = await User.findById(req.auth.sub).select("name email role phone addresses");
  if (!user) return res.status(404).json({ message: "Account not found." });
  res.json({ user });
}));

module.exports = router;
