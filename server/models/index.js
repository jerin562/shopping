const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ["customer", "admin"], default: "customer" },
  phone: { type: String, trim: true },
  addresses: [{ name: String, phone: String, address: String, city: String, postalCode: String, country: String }]
}, { timestamps: true });

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});
userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.password);
};

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 180 },
  slug: { type: String, unique: true, sparse: true },
  description: { type: String, default: "" },
  category: { type: String, required: true, trim: true },
  brand: { type: String, default: "AUREL" },
  price: { type: Number, required: true, min: 0 },
  oldPrice: { type: Number, min: 0 },
  stock: { type: Number, default: 0, min: 0 },
  imageUrl: { type: String, default: "" },
  images: [{ type: String }],
  colors: [{ type: String }],
  specifications: { type: Map, of: String, default: {} },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  active: { type: Boolean, default: true }
}, { timestamps: true });
productSchema.index({ name: "text", description: "text", brand: "text" });

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: "" }
}, { timestamps: true });

const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  items: [{ product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true }, quantity: { type: Number, min: 1, default: 1 } }]
}, { timestamps: true });

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  items: [{ product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" }, name: String, imageUrl: String, price: Number, quantity: Number }],
  shippingAddress: { name: String, email: String, phone: String, address: String, city: String, postalCode: String, country: String },
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  couponCode: String,
  shipping: { type: Number, required: true },
  total: { type: Number, required: true },
  paymentMethod: { type: String, enum: ["cod", "razorpay"], required: true },
  paymentStatus: { type: String, enum: ["pending", "verifying", "paid", "failed", "refunding", "refunded"], default: "pending" },
  paymentOrderId: String,
  paymentId: String,
  status: { type: String, enum: ["processing", "confirmed", "shipped", "delivered", "cancelled", "refunded"], default: "processing" }
}, { timestamps: true });

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, trim: true, maxlength: 120 },
  body: { type: String, required: true, trim: true, maxlength: 2000 }
}, { timestamps: true });
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

const wishlistSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }]
}, { timestamps: true });

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  discountType: { type: String, enum: ["percentage", "fixed"], required: true },
  value: { type: Number, required: true, min: 0 },
  minimumOrder: { type: Number, default: 0 },
  expiresAt: Date,
  active: { type: Boolean, default: true }
}, { timestamps: true });

const newsletterSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true }
}, { timestamps: true });

module.exports = {
  User: mongoose.models.User || mongoose.model("User", userSchema),
  Product: mongoose.models.Product || mongoose.model("Product", productSchema),
  Category: mongoose.models.Category || mongoose.model("Category", categorySchema),
  Cart: mongoose.models.Cart || mongoose.model("Cart", cartSchema),
  Order: mongoose.models.Order || mongoose.model("Order", orderSchema),
  Review: mongoose.models.Review || mongoose.model("Review", reviewSchema),
  Wishlist: mongoose.models.Wishlist || mongoose.model("Wishlist", wishlistSchema),
  Coupon: mongoose.models.Coupon || mongoose.model("Coupon", couponSchema),
  Newsletter: mongoose.models.Newsletter || mongoose.model("Newsletter", newsletterSchema)
};
