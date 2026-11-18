const express = require("express");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const { authenticate, adminOnly } = require("../middleware");

const router = express.Router();
const storage = multer.diskStorage({
  destination: path.join(__dirname, "..", "uploads"),
  filename: (_req, file, callback) => {
    const extension = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" }[file.mimetype];
    callback(null, `${crypto.randomUUID()}${extension}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) return callback(Object.assign(new Error("Only JPEG, PNG, and WebP images are allowed."), { status: 400 }));
    callback(null, true);
  }
});

router.post("/", authenticate, adminOnly, upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Choose an image to upload." });
  res.status(201).json({ imageUrl: `/uploads/${req.file.filename}` });
});
module.exports = router;
