const express = require("express");
const { nanoid } = require("nanoid"); // npm install nanoid@3
const Room = require("../models/Room");
const File = require("../models/File");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// All room routes are protected — must be logged in
router.use(protect);

// Create a new room
router.post("/", async (req, res) => {
  const { name, isPrivate } = req.body;
  try {
    const room = await Room.create({
      name,
      createdBy: req.user.id,
      members: [req.user.id],
      shareCode: nanoid(6),   // generates something like "xk92pz"
      isPrivate: isPrivate || false,
    });

    // Create a default file for the room
    await File.create({ room: room._id, name: "main.js", language: "javascript" });

    res.status(201).json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Join room by share code
router.post("/join", async (req, res) => {
  const { shareCode } = req.body;
  try {
    const room = await Room.findOne({ shareCode });
    if (!room) return res.status(404).json({ message: "Room not found" });

    // Add user to members if not already in
    if (!room.members.includes(req.user.id)) {
      room.members.push(req.user.id);
      await room.save();
    }
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all rooms for current user
router.get("/", async (req, res) => {
  try {
    const rooms = await Room.find({ members: req.user.id }).populate("createdBy", "username");
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single room by ID — called on Room page load
router.get("/:id", async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate("createdBy", "username");
    if (!room) return res.status(404).json({ message: "Room not found" });

    // Check user is a member
    if (!room.members.map(String).includes(req.user.id)) {
      return res.status(403).json({ message: "Not a member of this room" });
    }
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all files for a room
router.get("/:id/files", async (req, res) => {
  try {
    const files = await File.find({ room: req.params.id });
    res.json(files);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;