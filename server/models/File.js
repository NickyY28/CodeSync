const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
  {
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    name: { type: String, required: true },        // "index.js"
    language: { type: String, default: "javascript" },
    content: { type: String, default: "" },        // last saved code
  },
  { timestamps: true }
);

module.exports = mongoose.model("File", fileSchema);