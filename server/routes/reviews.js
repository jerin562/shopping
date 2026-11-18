const express = require("express");
const { z } = require("zod");
const { Review, Product, Order } = require("../models");
const { asyncHandler, authenticate, validateObjectId } = require("../middleware");

const router = express.Router();
router.post("/", authenticate, asyncHandler(async (req, res) => {
  const parsed = z.object({
    productId: z.string().refine(require("mongoose").isValidObjectId),
    rating: z.number().int().min(1).max(5),
    title: z.string().trim().max(120).optional(),
    body: z.string().trim().min(1).max(2000)
  }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Review details are invalid." });
  const product = await Product.findOne({ _id: parsed.data.productId, active: true });
  if (!product) return res.status(404).json({ message: "Product not found." });
  const purchased = await Order.exists({ user: req.auth.sub, status: "delivered", "items.product": product._id });
  if (!purchased) return res.status(403).json({ message: "Only customers who received this product can review it." });
  const review = await Review.findOneAndUpdate(
    { user: req.auth.sub, product: product._id },
    { ...parsed.data, user: req.auth.sub, product: product._id },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  const [stats] = await Review.aggregate([{ $match: { product: product._id } }, { $group: { _id: "$product", rating: { $avg: "$rating" }, count: { $sum: 1 } } }]);
  await Product.updateOne({ _id: product._id }, { rating: stats?.rating || 0, reviewCount: stats?.count || 0 });
  res.status(201).json({ review });
}));
router.get("/products/:id", validateObjectId, asyncHandler(async (req, res) => {
  const reviews = await Review.find({ product: req.params.id }).populate("user", "name").sort({ createdAt: -1 }).limit(50).lean();
  res.json({ reviews });
}));
module.exports = router;
