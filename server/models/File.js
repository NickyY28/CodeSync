const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
  {
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    name: { type: String, required: true },        // "index.js"
    language: { type: String, default: "javascript" },
    content: { type: String, default: "" },        // last saved code, so that when user refreshes the page, the code is still there
  },
  { timestamps: true }
);

module.exports = mongoose.model("File", fileSchema);



/*
 * WHY `room` IS REQUIRED IN FileSchema BUT `file` IS NOT REQUIRED IN RoomSchema?
 *
 * 1. The "Chicken-and-Egg" Conflict:
 *    If both schemas strictly required each other, neither could be created first. 
 *    You would need a Room ID to create a File, and a File ID to create a Room, 
 *    resulting in a system loop/deadlock.
 *
 * 2. Parent-Child Execution Flow:
 *    In a One-to-Many database relationship, the Parent (Room) must be created 
 *    first to generate a unique MongoDB ObjectId. Once the Room exists, the Child (File) 
 *    is created immediately after and attaches the Parent's ID to itself as a reference.
 *
 * 3. Preventing Orphan Data (Strictness):
 *    From a database perspective, a Room can safely exist without any code files inside it. 
 *    However, a Code File CANNOT exist in the system without belonging to a specific Room. 
 *    Therefore, `room: { required: true }` guarantees that no "orphan" files enter the DB.
 */
