const express = require("express");
const { z } = require("zod");
const { Coupon } = require("../models");
const { asyncHandler, authenticate, adminOnly } = require("../middleware");

const router = express.Router();
router.post("/validate", asyncHandler(async (req, res) => {
  const parsed = z.object({ code: z.string().trim().min(1).max(40), subtotal: z.coerce.number().min(0) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Enter a coupon code and valid subtotal." });
  const coupon = await Coupon.findOne({ code: parsed.data.code.toUpperCase(), active: true }).lean();
  if (!coupon || (coupon.expiresAt && coupon.expiresAt <= new Date())) return res.status(404).json({ message: "That coupon is invalid or has expired." });
  if (parsed.data.subtotal < coupon.minimumOrder) return res.status(400).json({ message: `This coupon requires a minimum order of $${coupon.minimumOrder.toFixed(2)}.` });
  const discount = Math.min(parsed.data.subtotal, coupon.discountType === "percentage" ? parsed.data.subtotal * coupon.value / 100 : coupon.value);
  res.json({ code: coupon.code, discount, total: parsed.data.subtotal - discount });
}));

router.post("/", authenticate, adminOnly, asyncHandler(async (req, res) => {
  const parsed = z.object({
    code: z.string().trim().min(2).max(40).regex(/^[A-Za-z0-9_-]+$/),
    discountType: z.enum(["percentage", "fixed"]),
    value: z.number().positive(),
    minimumOrder: z.number().min(0).default(0),
    expiresAt: z.string().datetime().optional()
  }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Coupon details are invalid." });
  if (parsed.data.discountType === "percentage" && parsed.data.value > 100) return res.status(400).json({ message: "Percentage discounts cannot exceed 100%." });
  const coupon = await Coupon.create({ ...parsed.data, code: parsed.data.code.toUpperCase() });
  res.status(201).json({ coupon });
}));
module.exports = router;
