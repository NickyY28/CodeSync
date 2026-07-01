const File = require("../models/File");
const {
  initRoom,
  getRoom,
  addUser,
  removeUser,
  updateCode,
  getFileCode,
  setActiveFile,
  updateCursor,
  persistAllFiles,
} = require("../roomState");

const ensureRoom = async (roomId) => {
  if (getRoom(roomId)) return getRoom(roomId);

  const dbFiles = await File.find({ room: roomId }).sort({ createdAt: 1 });
  const files = {};
  for (const f of dbFiles) {
    files[f._id.toString()] = f.content || "";
  }
  const activeFileId = dbFiles[0]?._id?.toString() || null;
  initRoom(roomId, files, activeFileId);
  return getRoom(roomId);
};

const initSocketHandlers = (io) => {
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id} | User: ${socket.user.username}`);

    socket.on("room:join", async ({ roomId }) => {
      if (!roomId) return;

      for (const r of socket.rooms) {
        if (r !== socket.id) {
          removeUser(r, socket.id);
          socket.leave(r);
        }
      }

      socket.join(roomId);
      socket.data.roomId = roomId;

      const room = await ensureRoom(roomId);

      addUser(roomId, {
        socketId: socket.id,
        userId: socket.user.id,
        username: socket.user.username,
      });

      const users = getRoom(roomId).users;
      const activeFileId = room.activeFileId || Object.keys(room.files)[0] || null;
      const code = activeFileId ? (room.files[activeFileId] || "") : "";

      socket.emit("room:state", {
        code,
        users,
        files: room.files,
        activeFileId,
      });

      io.to(roomId).emit("room:user-joined", { users });
    });

    socket.on("code:change", async ({ roomId, fileId, code }) => {
      if (!roomId || !fileId) return;
      if (!getRoom(roomId)) await ensureRoom(roomId);
      updateCode(roomId, fileId, code);

      socket.to(roomId).emit("code:update", { fileId, code });
    });

    socket.on("cursor:move", ({ roomId, position }) => {
      if (!roomId) return;
      updateCursor(roomId, socket.id, position);

      socket.to(roomId).emit("cursor:update", {
        socketId: socket.id,
        userId: socket.user.id,
        username: socket.user.username,
        color: getRoom(roomId)?.users.find((u) => u.socketId === socket.id)?.color,
        position,
      });
    });

    socket.on("chat:message", ({ roomId, message }) => {
      if (!roomId || !message?.trim()) return;

      const payload = {
        userId: socket.user.id,
        username: socket.user.username,
        message: message.trim(),
        timestamp: new Date().toISOString(),
      };

      io.to(roomId).emit("chat:message", payload);
    });

    socket.on("file:change", async ({ roomId, fileId }) => {
      const file = await File.findById(fileId);
      if (!file || !roomId) return;

      if (!getRoom(roomId)) await ensureRoom(roomId);

      const ramCode = getFileCode(roomId, fileId);
      const code = ramCode !== null ? ramCode : (file.content || "");
      updateCode(roomId, fileId, code);
      setActiveFile(roomId, fileId);

      io.to(roomId).emit("file:changed", {
        fileId: file._id.toString(),
        name: file.name,
        code,
        language: file.language,
      });
    });

    socket.on("file:created", async ({ roomId, file }) => {
      if (!roomId || !file?._id) return;
      if (!getRoom(roomId)) await ensureRoom(roomId);

      const fileId = file._id.toString();
      updateCode(roomId, fileId, file.content || "");
      setActiveFile(roomId, fileId);

      io.to(roomId).emit("file:created", {
        file: { ...file, _id: fileId },
      });
    });

    socket.on("code:save", async ({ roomId, fileId, code }) => {
      try {
        if (!roomId || !fileId) throw new Error("Missing roomId or fileId");
        if (!getRoom(roomId)) await ensureRoom(roomId);

        updateCode(roomId, fileId, code);
        const updated = await File.findByIdAndUpdate(
          fileId,
          { content: code },
          { returnDocument: "after" }
        );
        if (!updated) throw new Error("File not found");

        io.to(roomId).emit("code:saved", { savedBy: socket.user.username, fileId });
        console.log(`Saved file ${fileId} by ${socket.user.username}`);
      } catch (err) {
        socket.emit("code:save-error", { message: err.message || "Failed to save" });
      }
    });

    const handleLeave = async (roomId, socketId) => {
      if (!roomId) return;

      removeUser(roomId, socketId);
      const room = getRoom(roomId);

      if (room) {
        await persistAllFiles(roomId, File);
        io.to(roomId).emit("room:user-left", {
          users: room.users,
          socketId,
        });
      }
    };

    socket.on("disconnect", async () => {
      console.log(`Disconnected: ${socket.id}`);
      const roomId = socket.data.roomId;
      if (roomId) await handleLeave(roomId, socket.id);
    });

    socket.on("room:leave", async ({ roomId }) => {
      if (!roomId) return;
      socket.leave(roomId);
      if (socket.data.roomId === roomId) socket.data.roomId = null;
      await handleLeave(roomId, socket.id);
    });
  });
};

module.exports = { initSocketHandlers };
