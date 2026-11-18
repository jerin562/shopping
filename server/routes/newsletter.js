const express = require("express");
const { z } = require("zod");
const { Newsletter } = require("../models");
const { asyncHandler, authenticate, adminOnly } = require("../middleware");

const router = express.Router();
router.post("/", asyncHandler(async (req, res) => {
  const parsed = z.object({ email: z.string().email().max(254).transform((email) => email.toLowerCase()) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Enter a valid email address." });
  await Newsletter.updateOne({ email: parsed.data.email }, { $setOnInsert: { email: parsed.data.email } }, { upsert: true });
  res.status(201).json({ message: "You're on the list. Use WELCOME10 for 10% off your first order." });
}));
router.get("/", authenticate, adminOnly, asyncHandler(async (_req, res) => {
  const subscribers = await Newsletter.find().select("email createdAt").sort({ createdAt: -1 }).limit(500).lean();
  res.json({ subscribers });
}));
module.exports = router;
