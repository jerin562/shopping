const express = require("express");
const crypto = require("crypto");
const mongoose = require("mongoose");
const Razorpay = require("razorpay");
const { z } = require("zod");
const { Order, Product, Cart, Coupon } = require("../models");
const { asyncHandler, authenticate, adminOnly, validateObjectId } = require("../middleware");

const router = express.Router();
const addressSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().email().max(254),
  phone: z.string().trim().min(7).max(30),
  address: z.string().trim().min(3).max(250),
  city: z.string().trim().min(1).max(100),
  postalCode: z.string().trim().min(2).max(20),
  country: z.string().trim().min(2).max(100)
});

async function reserveStock(items) {
  const updated = [];
  for (const item of items) {
    const product = await Product.findOneAndUpdate(
      { _id: item.product, active: true, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } },
      { new: true }
    );
    if (!product) {
      for (const previous of updated) await Product.updateOne({ _id: previous.product }, { $inc: { stock: previous.quantity } });
      throw Object.assign(new Error("One or more products no longer have enough stock."), { status: 409 });
    }
    updated.push(item);
  }
}

router.post("/", authenticate, asyncHandler(async (req, res) => {
  const parsed = z.object({
    items: z.array(z.object({ product: z.string().min(1).max(100), quantity: z.number().int().min(1).max(99) })).min(1).max(30),
    shippingAddress: addressSchema,
    paymentMethod: z.enum(["cod", "razorpay"]),
    couponCode: z.string().trim().min(1).max(40).optional()
  }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Order details are invalid.", errors: parsed.error.flatten().fieldErrors });

  const resolved = [];
  for (const requested of parsed.data.items) {
    const product = mongoose.isValidObjectId(requested.product)
      ? await Product.findOne({ _id: requested.product, active: true })
      : await Product.findOne({ slug: requested.product, active: true });
    if (!product) return res.status(404).json({ message: "A product in your bag is no longer available." });
    if (product.stock < requested.quantity) return res.status(409).json({ message: `${product.name} does not have enough stock.` });
    resolved.push({ product: product._id, name: product.name, imageUrl: product.imageUrl, price: product.price, quantity: requested.quantity });
  }

  const subtotal = resolved.reduce((sum, item) => sum + item.price * item.quantity, 0);
  let discount = 0;
  let couponCode;
  if (parsed.data.couponCode) {
    const coupon = await Coupon.findOne({ code: parsed.data.couponCode.toUpperCase(), active: true });
    if (!coupon || (coupon.expiresAt && coupon.expiresAt <= new Date())) return res.status(400).json({ message: "That coupon is invalid or has expired." });
    if (subtotal < coupon.minimumOrder) return res.status(400).json({ message: `This coupon requires a minimum order of $${coupon.minimumOrder.toFixed(2)}.` });
    discount = Math.min(subtotal, coupon.discountType === "percentage" ? subtotal * coupon.value / 100 : coupon.value);
    couponCode = coupon.code;
  }
  const shipping = subtotal - discount >= 100 ? 0 : 8;
  const orderData = {
    user: req.auth.sub,
    items: resolved,
    shippingAddress: parsed.data.shippingAddress,
    subtotal,
    discount,
    couponCode,
    shipping,
    total: subtotal - discount + shipping,
    paymentMethod: parsed.data.paymentMethod
  };

  if (parsed.data.paymentMethod === "razorpay") {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(503).json({ message: "Online payment is not configured. Choose cash on delivery or contact the store." });
    }
    const order = await Order.create(orderData);
    try {
      const gateway = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
      const paymentOrder = await gateway.orders.create({ amount: Math.round(order.total * 100), currency: "USD", receipt: order.id });
      order.paymentOrderId = paymentOrder.id;
      await order.save();
      return res.status(201).json({ order, payment: { keyId: process.env.RAZORPAY_KEY_ID, orderId: paymentOrder.id, amount: paymentOrder.amount, currency: paymentOrder.currency } });
    } catch (error) {
      await Order.deleteOne({ _id: order._id });
      throw error;
    }
  }

  await reserveStock(resolved);
  let order;
  try {
    order = await Order.create(orderData);
  } catch (error) {
    for (const item of resolved) await Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } });
    throw error;
  }
  await Cart.updateOne({ user: req.auth.sub }, { $set: { items: [] } });
  res.status(201).json({ order });
}));

router.post("/:id/verify-payment", authenticate, validateObjectId, asyncHandler(async (req, res) => {
  const parsed = z.object({ razorpay_order_id: z.string().min(1), razorpay_payment_id: z.string().min(1), razorpay_signature: z.string().min(1) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Payment verification details are invalid." });
  const order = await Order.findOne({ _id: req.params.id, user: req.auth.sub });
  if (!order) return res.status(404).json({ message: "Order not found." });
  if (order.paymentMethod !== "razorpay" || order.status !== "processing" || !order.paymentOrderId || order.paymentStatus !== "pending" || parsed.data.razorpay_order_id !== order.paymentOrderId) {
    return res.status(409).json({ message: "This order is not awaiting this payment." });
  }
  if (!process.env.RAZORPAY_KEY_SECRET) return res.status(503).json({ message: "Payment verification is not configured." });
  const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${order.paymentOrderId}|${parsed.data.razorpay_payment_id}`).digest("hex");
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(parsed.data.razorpay_signature);
  if (expectedBuffer.length !== receivedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)) {
    return res.status(400).json({ message: "Payment signature verification failed." });
  }
  const claimed = await Order.findOneAndUpdate(
    { _id: order._id, user: req.auth.sub, paymentStatus: "pending" },
    { $set: { paymentStatus: "verifying", paymentId: parsed.data.razorpay_payment_id } },
    { new: true }
  );
  if (!claimed) return res.status(409).json({ message: "Payment verification is already in progress or complete." });
  order.paymentStatus = claimed.paymentStatus;
  order.paymentId = claimed.paymentId;
  try {
    await reserveStock(order.items);
  } catch (error) {
    if (error.status !== 409) throw error;
    try {
      const gateway = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
      await gateway.payments.refund(order.paymentId, { amount: Math.round(order.total * 100) });
      order.paymentStatus = "refunded";
      order.status = "refunded";
      await order.save();
      return res.status(409).json({ message: "The item sold out during payment. A full refund has been submitted." });
    } catch (refundError) {
      console.error("Automatic refund failed after stock conflict:", refundError);
      order.paymentStatus = "paid";
      await order.save();
      return res.status(502).json({ message: "Payment was received but stock could not be reserved. Contact support for a refund." });
    }
  }
  order.paymentStatus = "paid";
  order.status = "confirmed";
  await order.save();
  await Cart.updateOne({ user: req.auth.sub }, { $set: { items: [] } });
  res.json({ order });
}));

router.get("/my-orders", authenticate, asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.auth.sub }).sort({ createdAt: -1 }).lean();
  res.json({ orders });
}));

router.get("/", authenticate, adminOnly, asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
  const [orders, total] = await Promise.all([
    Order.find().populate("user", "name email").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Order.countDocuments()
  ]);
  res.json({ orders, page, pages: Math.ceil(total / limit), total });
}));

router.put("/:id/status", authenticate, adminOnly, validateObjectId, asyncHandler(async (req, res) => {
  const parsed = z.object({ status: z.enum(["confirmed", "shipped", "delivered", "cancelled"]) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Choose a valid order status." });
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found." });
  const transitions = {
    processing: ["confirmed", "cancelled"],
    confirmed: ["shipped", "cancelled"],
    shipped: ["delivered"],
    delivered: [],
    cancelled: [],
    refunded: []
  };
  if (!transitions[order.status]?.includes(parsed.data.status)) {
    return res.status(409).json({ message: `Order cannot move from ${order.status} to ${parsed.data.status}.` });
  }
  if (order.paymentMethod === "razorpay" && order.paymentStatus !== "paid" && parsed.data.status !== "cancelled") {
    return res.status(409).json({ message: "An unpaid online order cannot be processed or shipped." });
  }
  if (order.paymentStatus === "paid" && parsed.data.status === "cancelled") {
    return res.status(409).json({ message: "Paid orders require a verified payment-provider refund before cancellation." });
  }
  if (order.paymentMethod === "razorpay" && order.paymentStatus === "pending" && parsed.data.status === "cancelled") {
    return res.status(409).json({ message: "An online order cannot be cancelled while payment is still pending." });
  }
  if (["verifying", "refunding"].includes(order.paymentStatus)) {
    return res.status(409).json({ message: "Wait for the in-progress payment operation to finish before changing order status." });
  }
  const updated = await Order.findOneAndUpdate(
    { _id: order._id, status: order.status },
    { $set: {
      status: parsed.data.status,
      ...(order.paymentMethod === "cod" && parsed.data.status === "delivered" ? { paymentStatus: "paid" } : {})
    } },
    { new: true }
  );
  if (!updated) return res.status(409).json({ message: "Order was updated by another request. Refresh and try again." });
  if (parsed.data.status === "cancelled") {
    for (const item of order.items) await Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } });
  }
  res.json({ order: updated });
}));

router.post("/:id/refund", authenticate, adminOnly, validateObjectId, asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found." });
  if (order.paymentMethod !== "razorpay" || order.paymentStatus !== "paid" || !order.paymentId) {
    return res.status(409).json({ message: "Only paid online orders can be refunded through this endpoint." });
  }
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return res.status(503).json({ message: "Razorpay refunds are not configured." });
  }
  const claimed = await Order.findOneAndUpdate(
    { _id: order._id, paymentStatus: "paid" },
    { $set: { paymentStatus: "refunding" } },
    { new: true }
  );
  if (!claimed) return res.status(409).json({ message: "A refund is already being processed." });
  try {
    const gateway = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
    await gateway.payments.refund(order.paymentId, { amount: Math.round(order.total * 100) });
  } catch (error) {
    await Order.updateOne({ _id: order._id, paymentStatus: "refunding" }, { $set: { paymentStatus: "paid" } });
    throw error;
  }
  order.paymentStatus = "refunded";
  order.status = "refunded";
  await order.save();
  res.json({ order, message: "Full refund submitted to Razorpay." });
}));

router.get("/:id", authenticate, validateObjectId, asyncHandler(async (req, res) => {
  const filter = req.auth.role === "admin" ? { _id: req.params.id } : { _id: req.params.id, user: req.auth.sub };
  const order = await Order.findOne(filter).populate("user", "name email").lean();
  if (!order) return res.status(404).json({ message: "Order not found." });
  res.json({ order });
}));

module.exports = router;
