const express = require("express");
const { User, Product, Order } = require("../models");
const { asyncHandler, authenticate, adminOnly } = require("../middleware");

const router = express.Router();
router.use(authenticate, adminOnly);

router.get("/overview", asyncHandler(async (_req, res) => {
  const [customers, products, orders, sales, recentOrders] = await Promise.all([
    User.countDocuments({ role: "customer" }),
    Product.countDocuments({ active: true }),
    Order.countDocuments(),
    Order.aggregate([{ $match: { $or: [{ paymentStatus: "paid" }, { paymentMethod: "cod", status: "delivered" }] } }, { $group: { _id: null, revenue: { $sum: "$total" } } }]),
    Order.find().populate("user", "name email").sort({ createdAt: -1 }).limit(8).lean()
  ]);
  res.json({ customers, products, orders, revenue: sales[0]?.revenue || 0, recentOrders });
}));

router.get("/customers", asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
  const [customers, total] = await Promise.all([
    User.find({ role: "customer" }).select("name email phone createdAt").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    User.countDocuments({ role: "customer" })
  ]);
  res.json({ customers, page, pages: Math.ceil(total / limit), total });
}));

module.exports = router;
