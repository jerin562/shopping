const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function authenticate(req, res, next) {
  const header = req.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Sign in to continue." });
  try {
    req.auth = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Your session is invalid or has expired." });
  }
}

function adminOnly(req, res, next) {
  if (req.auth?.role !== "admin") return res.status(403).json({ message: "Administrator access is required." });
  next();
}

function validateObjectId(req, res, next) {
  const id = req.params.id;
  if (id && !mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid resource identifier." });
  next();
}

module.exports = { asyncHandler, authenticate, adminOnly, validateObjectId };
