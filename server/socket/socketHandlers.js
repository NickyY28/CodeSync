const File = require("../models/File");
const {
  initRoom,
  getRoom,
  addUser,
  removeUser,
  updateCode,
  updateCursor,
} = require("../roomState");

const initSocketHandlers = (io) => {

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id} | User: ${socket.user.username}`);

    // ── room:join ──────────────────────────────────────────────
    // Fired when a user navigates to a room page
    socket.on("room:join", async ({ roomId }) => {
      socket.join(roomId); // Socket.io built-in — adds socket to that room channel

      // Load the room's last saved code from MongoDB
      // (only needed if room is not already in RAM — first user joining)
      let currentCode = "";
      if (!getRoom(roomId)) {
        const file = await File.findOne({ room: roomId }).sort({ createdAt: 1 });
        currentCode = file?.content || "";
        initRoom(roomId, currentCode);
      } else {
        currentCode = getRoom(roomId).code;
      }

      // Register this user in the room's state
      addUser(roomId, {
        socketId: socket.id,
        userId: socket.user.id,
        username: socket.user.username,
      });

      // Send the current code ONLY to the user who just joined
      // so their editor starts with the latest state
      socket.emit("room:state", {
        code: currentCode,
        users: getRoom(roomId).users,
      });

      // Tell EVERYONE ELSE in the room that a new user joined
      // socket.to() = everyone in room EXCEPT this socket
      socket.to(roomId).emit("room:user-joined", {
        users: getRoom(roomId).users,
      });
    });

    // ── code:change ────────────────────────────────────────────
    // Fired on every keystroke from Monaco Editor
    socket.on("code:change", ({ roomId, code }) => {
      updateCode(roomId, code); // update RAM

      // Broadcast to everyone in room EXCEPT the sender
      // If we sent back to sender too → echo loop → editor freezes
      socket.to(roomId).emit("code:update", { code });
    });

    // ── cursor:move ────────────────────────────────────────────
    // Fired when user's cursor position changes in Monaco
    socket.on("cursor:move", ({ roomId, position }) => {
      updateCursor(roomId, socket.id, position);

      // Relay to others with enough info to render the cursor overlay
      socket.to(roomId).emit("cursor:update", {
        socketId: socket.id,
        userId: socket.user.id,
        username: socket.user.username,
        color: getRoom(roomId)?.users.find((u) => u.socketId === socket.id)?.color,
        position,
      });
    });

    // ── chat:message ───────────────────────────────────────────
    // Per-room chat — broadcast to everyone INCLUDING sender
    // (sender needs to see their own message appear)
    socket.on("chat:message", ({ roomId, message }) => {
      const payload = {
        userId: socket.user.id,
        username: socket.user.username,
        message,
        timestamp: new Date().toISOString(),
      };

      // io.to() includes sender — correct for chat
      io.to(roomId).emit("chat:message", payload);
    });

    // ── file:change ────────────────────────────────────────────
    // When user switches to a different file tab in the room
    socket.on("file:change", async ({ roomId, fileId }) => {
      const file = await File.findById(fileId);
      if (!file) return;

      // Update RAM with new file's code
      updateCode(roomId, file.content);

      // Tell everyone in room (including sender) to switch files
      io.to(roomId).emit("file:changed", {
        fileId,
        code: file.content,
        language: file.language,
      });
    });

    // ── code:save ──────────────────────────────────────────────
    // Explicit save — user presses Ctrl+S
    socket.on("code:save", async ({ roomId, fileId }) => {
      const room = getRoom(roomId);
      if (!room) return;

      await File.findByIdAndUpdate(fileId, { content: room.code });

      // Confirm save to everyone in the room
      io.to(roomId).emit("code:saved", { savedBy: socket.user.username });
    });

    // ── disconnect ─────────────────────────────────────────────
    // Fires automatically when user closes tab or loses connection
    socket.on("disconnect", async () => {
      console.log(`Disconnected: ${socket.id}`);

      // Find which room this socket was in
      // socket.rooms is a Set — first entry is always socket.id itself,
      // second is the actual roomId they joined
      const joinedRooms = [...socket.rooms].filter((r) => r !== socket.id);

      for (const roomId of joinedRooms) {
        removeUser(roomId, socket.id);

        const room = getRoom(roomId);

        if (room) {
          // Flush current code to MongoDB when user leaves
          // so next person who joins gets the latest code
          await File.findOneAndUpdate(
            { room: roomId },
            { content: room.code },
            { sort: { createdAt: 1 } }
          );

          // Tell remaining users someone left
          io.to(roomId).emit("room:user-left", { users: room.users });
        }
      }
    });

    // inside io.on("connection") — add alongside the other events
    socket.on("room:leave", ({ roomId }) => {
    socket.leave(roomId);
    removeUser(roomId, socket.id);
    const room = getRoom(roomId);
    if (room) {
      io.to(roomId).emit("room:user-left", {
        users: room.users,
        socketId: socket.id,
     });
    }
   });
  });
};

module.exports = { initSocketHandlers };