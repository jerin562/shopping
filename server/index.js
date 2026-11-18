require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const fs = require("fs");

const app = express();
const port = Number(process.env.PORT) || 4000;

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be configured with at least 32 characters.");
}

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads"), { maxAge: "1d", immutable: true }));
app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: "draft-7", legacyHeaders: false }));
app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: "draft-7", legacyHeaders: false }));

app.get("/api/health", (_req, res) => res.json({ status: "ok", database: mongoose.connection.readyState === 1 ? "connected" : "disconnected" }));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/products"));
app.use("/api/categories", require("./routes/categories"));
app.use("/api/coupons", require("./routes/coupons"));
app.use("/api/newsletter", require("./routes/newsletter"));
app.use("/api/cart", require("./routes/cart"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/wishlist", require("./routes/wishlist"));
app.use("/api/uploads", require("./routes/uploads"));
app.use("/api/admin", require("./routes/admin"));

app.use((_req, res) => res.status(404).json({ message: "API endpoint not found." }));
app.use((error, _req, res, _next) => {
  if (error.code === 11000) return res.status(409).json({ message: "A record with those details already exists." });
  if (error.name === "ValidationError") return res.status(400).json({ message: "The submitted data is invalid.", errors: Object.values(error.errors).map((item) => item.message) });
  if (error.name === "CastError") return res.status(400).json({ message: "Invalid resource identifier." });
  if (error.name === "MulterError") return res.status(400).json({ message: error.code === "LIMIT_FILE_SIZE" ? "Image files must be 5 MB or smaller." : "Image upload could not be completed." });
  if (error.status && error.status < 500) return res.status(error.status).json({ message: error.message });
  console.error("API error:", error);
  res.status(500).json({ message: "Something went wrong. Please try again." });
});

async function start() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI must be configured before starting the API.");
  await mongoose.connect(process.env.MONGODB_URI);
  const uploads = path.join(__dirname, "uploads");
  if (!fs.existsSync(uploads)) fs.mkdirSync(uploads, { recursive: true });
  app.listen(port, () => console.log(`AUREL API listening on http://localhost:${port}`));
}

start().catch((error) => {
  console.error("API startup failed:", error.message);
  process.exitCode = 1;
});
