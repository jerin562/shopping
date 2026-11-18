const express = require("express");
const { z } = require("zod");
const { Category } = require("../models");
const { asyncHandler, authenticate, adminOnly } = require("../middleware");

const router = express.Router();
router.get("/", asyncHandler(async (_req, res) => res.json({ categories: await Category.find().sort({ name: 1 }).lean() })));
router.post("/", authenticate, adminOnly, asyncHandler(async (req, res) => {
  const parsed = z.object({ name: z.string().trim().min(1).max(80), slug: z.string().trim().min(1).max(100).regex(/^[a-z0-9-]+$/), description: z.string().max(500).optional() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Category details are invalid." });
  const category = await Category.create(parsed.data);
  res.status(201).json({ category });
}));
module.exports = router;
