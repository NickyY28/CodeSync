const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// ─── REGISTER ───────────────────────────────────────────────
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // 1. Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // 2. Hash the password — 10 is the "salt rounds" (cost factor)
    //    Higher = slower hash = harder to brute-force, but costs more CPU
    //    10 is the standard safe default
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Save user to DB
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    // 4. Sign a JWT — payload is minimal (just id + username)
    //    Never put sensitive data in JWT payload — it's base64, not encrypted
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" } // token expires in 7 days
    );

    res.status(201).json({ token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ─── LOGIN ───────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 2. Compare entered password with stored hash
    //    bcrypt.compare hashes the input and compares — never decrypts
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 3. Sign and return JWT
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;