const express = require("express");
const { z } = require("zod");
const { Cart, Product } = require("../models");
const { asyncHandler, authenticate, validateObjectId } = require("../middleware");

const router = express.Router();
router.use(authenticate);

router.get("/", asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.auth.sub }).populate("items.product").lean();
  res.json({ cart: cart || { items: [] } });
}));

router.post("/", asyncHandler(async (req, res) => {
  const parsed = z.object({ productId: z.string().refine(require("mongoose").isValidObjectId), quantity: z.number().int().min(1).max(99).default(1) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "A valid product and quantity are required." });
  const product = await Product.findOne({ _id: parsed.data.productId, active: true });
  if (!product) return res.status(404).json({ message: "Product not found." });
  const currentCart = await Cart.findOne({ user: req.auth.sub });
  const currentItem = currentCart?.items.find((item) => item.product.equals(product._id));
  if (product.stock < (currentItem?.quantity || 0) + parsed.data.quantity) return res.status(409).json({ message: "There is not enough stock for that quantity." });
  const cart = await Cart.findOneAndUpdate(
    { user: req.auth.sub },
    { $setOnInsert: { user: req.auth.sub }, $inc: { "items.$[item].quantity": parsed.data.quantity } },
    { new: true, upsert: false, arrayFilters: [{ "item.product": product._id }] }
  );
  if (cart) {
    const alreadyPresent = cart.items.some((item) => item.product.equals(product._id));
    if (!alreadyPresent) cart.items.push({ product: product._id, quantity: parsed.data.quantity });
    await cart.save();
    return res.json({ cart: await cart.populate("items.product") });
  }
  const created = await Cart.findOneAndUpdate({ user: req.auth.sub }, { $setOnInsert: { user: req.auth.sub, items: [{ product: product._id, quantity: parsed.data.quantity }] } }, { new: true, upsert: true }).populate("items.product");
  res.status(201).json({ cart: created });
}));

router.put("/:id", validateObjectId, asyncHandler(async (req, res) => {
  const parsed = z.object({ quantity: z.number().int().min(1).max(99) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Quantity must be between 1 and 99." });
  const cart = await Cart.findOne({ user: req.auth.sub });
  if (!cart) return res.status(404).json({ message: "Cart not found." });
  const item = cart.items.find((entry) => entry.product.equals(req.params.id));
  if (!item) return res.status(404).json({ message: "Cart item not found." });
  const product = await Product.findById(item.product);
  if (!product || !product.active || product.stock < parsed.data.quantity) return res.status(409).json({ message: "Requested quantity is not available." });
  item.quantity = parsed.data.quantity;
  await cart.save();
  res.json({ cart: await cart.populate("items.product") });
}));

router.delete("/:id", validateObjectId, asyncHandler(async (req, res) => {
  const cart = await Cart.findOneAndUpdate({ user: req.auth.sub }, { $pull: { items: { product: req.params.id } } }, { new: true }).populate("items.product");
  if (!cart) return res.status(404).json({ message: "Cart not found." });
  res.json({ cart });
}));

module.exports = router;
