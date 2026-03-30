const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, //ref: User means it will refer to the User model,id is linked to user table
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    shareCode: { type: String, unique: true }, // 6-char join code
    isPrivate: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Room", roomSchema);

/*
 * WORKFLOW SUMMARY (Mongoose & MongoDB):
 * 
 * 1. Schema Initialization (Runs Once): 
 *    The `mongoose.Schema()` function executes ONLY ONCE when the Node server starts. 
 *    It keeps this "blueprint" or "ruleset" in memory. Unlike SQL, it DOES NOT create 
 *    a pre-existing table with blank columns in the database.
 * 
 * 2. Document Creation (Runs per Request): 
 *    When a user creates a room, `Room.create(...)` (in routes/rooms.js) is called.
 *    The `roomSchema` function does NOT run again. Instead, Mongoose takes the incoming 
 *    data (name, user IDs, nanoid(6) shareCode) and validates it against the blueprint in memory.
 * 
 * 3. Database Insertion: 
 *    If the data strictly follows the blueprint rules, Mongoose packages it into a brand  
 *    new JSON-like object (a Document) along with the auto-generated timestamps.
 *    It then drops this newly created document right into the MongoDB collection.
 */
