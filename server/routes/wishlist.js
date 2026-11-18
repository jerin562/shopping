const express = require("express");
const { z } = require("zod");
const { Wishlist, Product } = require("../models");
const { asyncHandler, authenticate, validateObjectId } = require("../middleware");

const router = express.Router();
router.use(authenticate);
router.get("/", asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.auth.sub }).populate("products").lean();
  res.json({ wishlist: wishlist || { products: [] } });
}));
router.post("/", asyncHandler(async (req, res) => {
  const parsed = z.object({ productId: z.string().refine(require("mongoose").isValidObjectId) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "A valid product is required." });
  if (!(await Product.exists({ _id: parsed.data.productId, active: true }))) return res.status(404).json({ message: "Product not found." });
  const wishlist = await Wishlist.findOneAndUpdate({ user: req.auth.sub }, { $addToSet: { products: parsed.data.productId } }, { upsert: true, new: true }).populate("products");
  res.status(201).json({ wishlist });
}));
router.delete("/:id", validateObjectId, asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.findOneAndUpdate({ user: req.auth.sub }, { $pull: { products: req.params.id } }, { new: true }).populate("products");
  if (!wishlist) return res.status(404).json({ message: "Wishlist not found." });
  res.json({ wishlist });
}));
module.exports = router;
