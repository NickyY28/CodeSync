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
  const shareCode = (req.body.shareCode || "").trim();
  try {
    const room = await Room.findOne({
      shareCode: { $regex: new RegExp(`^${shareCode.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
    });
    if (!room) return res.status(404).json({ message: "Room not found" });

    // Add user to members if not already in (compare as strings — JWT id is a string)
    const memberIds = room.members.map(String);
    if (!memberIds.includes(String(req.user.id))) {
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

// Create new file in a room
router.post("/:id/files", async (req, res) => {
  const { name } = req.body;

  // Auto-detect language from file extension
  const ext = name.split(".").pop();
  const LANG_MAP = {
    js: "javascript", ts: "typescript",
    py: "python", cpp: "cpp", c: "c",
    java: "java", go: "go", rs: "rust",
    html: "html", css: "css",
  };
  const language = LANG_MAP[ext] || "plaintext";

  try {
    const file = await File.create({
      room: req.params.id,
      name,
      language,
      content: "",
    });
    res.status(201).json(file);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Rename a file
router.patch("/:id/files/:fileId", async (req, res) => {
  const { name } = req.body;
  const ext = name.split(".").pop();
  const LANG_MAP = {
    js: "javascript", ts: "typescript",
    py: "python", cpp: "cpp", c: "c",
    java: "java", go: "go", rs: "rust",
    html: "html", css: "css",
  };
  const language = LANG_MAP[ext] || "plaintext";

  try {
    const file = await File.findByIdAndUpdate(
      req.params.fileId,
      { name, language },
      { new: true }   // return updated document
    );
    res.json(file);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a file
router.delete("/:id/files/:fileId", async (req, res) => {
  try {
    // Don't allow deleting the last file
    const count = await File.countDocuments({ room: req.params.id });
    if (count <= 1) {
      return res.status(400).json({ message: "Cannot delete the last file" });
    }
    await File.findByIdAndDelete(req.params.fileId);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;