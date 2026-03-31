// This Map is the "hot" live state of all active rooms.
// It lives in server RAM — fast reads/writes, no DB overhead.

const rooms = new Map();

// Assign a unique color to each user so their cursor is distinguishable
const COLORS = [
  "#f9802a", "#8b5cf6", "#06b6d4",
  "#10b981", "#ef4444", "#99650d",
];

const getRoom = (roomId) => rooms.get(roomId);

const initRoom = (roomId, code = "") => {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, { code, users: [], cursors: {} });
  }
  return rooms.get(roomId);
};

const addUser = (roomId, userInfo) => {
  const room = getRoom(roomId);
  if (!room) return;
  // Assign color based on how many users are already in room
  const color = COLORS[room.users.length % COLORS.length];
  room.users.push({ ...userInfo, color });
};

const removeUser = (roomId, socketId) => {
  const room = getRoom(roomId);
  if (!room) return;
  room.users = room.users.filter((u) => u.socketId !== socketId);
  delete room.cursors[socketId];
  // If room is empty, clean it up from RAM
  if (room.users.length === 0) rooms.delete(roomId);
};

const updateCode = (roomId, code) => {
  const room = getRoom(roomId);
  if (room) room.code = code;
};

const updateCursor = (roomId, socketId, position) => {
  const room = getRoom(roomId);
  if (room) room.cursors[socketId] = position;
};

module.exports = { initRoom, getRoom, addUser, removeUser, updateCode, updateCursor };

// Why a separate file for roomState? Both index.js (where you attach Socket.io) and socketHandlers.js need access to the same Map. If you define the Map inside either file, the other can't share it. A dedicated module exports a single shared instance — Node.js caches module exports, so everyone importing roomState.js gets the exact same Map object.