const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    shareCode: { type: String, unique: true }, // 6-char join code
    isPrivate: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Room", roomSchema);