const express = require("express");
const mongoose = require("mongoose");
const { z } = require("zod");
const { Product, Review } = require("../models");
const { asyncHandler, authenticate, adminOnly, validateObjectId } = require("../middleware");

const router = express.Router();
const productInput = z.object({
  name: z.string().trim().min(1).max(180),
  description: z.string().max(5000).optional(),
  category: z.string().trim().min(1).max(80),
  brand: z.string().trim().max(80).optional(),
  price: z.coerce.number().min(0),
  oldPrice: z.coerce.number().min(0).optional(),
  stock: z.coerce.number().int().min(0).optional(),
  imageUrl: z.string().max(1000).optional(),
  images: z.array(z.string().max(1000)).max(10).optional(),
  colors: z.array(z.string().max(50)).max(20).optional(),
  active: z.coerce.boolean().optional()
});

router.get("/", asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(48, Math.max(1, Number(req.query.limit) || 12));
  const filter = { active: true };
  if (req.query.category) filter.category = String(req.query.category);
  if (req.query.brand) filter.brand = String(req.query.brand);
  if (req.query.search) filter.$text = { $search: String(req.query.search).slice(0, 100) };
  const price = {};
  if (req.query.minPrice && Number.isFinite(Number(req.query.minPrice))) price.$gte = Number(req.query.minPrice);
  if (req.query.maxPrice && Number.isFinite(Number(req.query.maxPrice))) price.$lte = Number(req.query.maxPrice);
  if (Object.keys(price).length) filter.price = price;
  if (req.query.minRating && Number.isFinite(Number(req.query.minRating))) filter.rating = { $gte: Math.min(5, Math.max(0, Number(req.query.minRating))) };
  const sortBy = { newest: { createdAt: -1 }, price_asc: { price: 1 }, price_desc: { price: -1 }, popular: { rating: -1 } }[req.query.sort] || { createdAt: -1 };
  const [products, total] = await Promise.all([
    Product.find(filter).sort(sortBy).skip((page - 1) * limit).limit(limit).lean(),
    Product.countDocuments(filter)
  ]);
  res.json({ products, page, pages: Math.ceil(total / limit), total });
}));

router.get("/:id", asyncHandler(async (req, res) => {
  const identifier = mongoose.isValidObjectId(req.params.id) ? { _id: req.params.id } : { slug: req.params.id };
  const product = await Product.findOne({ ...identifier, active: true }).lean();
  if (!product) return res.status(404).json({ message: "Product not found." });
  res.json({ product });
}));

router.post("/", authenticate, adminOnly, asyncHandler(async (req, res) => {
  const parsed = productInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Product details are invalid.", errors: parsed.error.flatten().fieldErrors });
  const product = await Product.create(parsed.data);
  res.status(201).json({ product });
}));

router.put("/:id", authenticate, adminOnly, validateObjectId, asyncHandler(async (req, res) => {
  const parsed = productInput.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Product details are invalid.", errors: parsed.error.flatten().fieldErrors });
  const product = await Product.findByIdAndUpdate(req.params.id, parsed.data, { new: true, runValidators: true });
  if (!product) return res.status(404).json({ message: "Product not found." });
  res.json({ product });
}));

router.delete("/:id", authenticate, adminOnly, validateObjectId, asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
  if (!product) return res.status(404).json({ message: "Product not found." });
  res.json({ message: "Product archived." });
}));

router.get("/:id/reviews", asyncHandler(async (req, res) => {
  const identifier = mongoose.isValidObjectId(req.params.id) ? { _id: req.params.id } : { slug: req.params.id };
  const product = await Product.findOne({ ...identifier, active: true }).select("_id");
  if (!product) return res.status(404).json({ message: "Product not found." });
  const [reviews, average] = await Promise.all([
    Review.find({ product: product._id }).populate("user", "name").sort({ createdAt: -1 }).limit(50).lean(),
    Review.aggregate([{ $match: { product: product._id } }, { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } }])
  ]);
  res.json({ reviews, rating: average[0]?.average || 0, count: average[0]?.count || 0 });
}));

module.exports = router;
