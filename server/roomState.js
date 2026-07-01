const rooms = new Map();

const COLORS = [
  "#f9802a", "#8b5cf6", "#06b6d4",
  "#10b981", "#ef4444", "#99650d",
];

const getRoom = (roomId) => rooms.get(roomId);

const initRoom = (roomId, files = {}, activeFileId = null) => {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      files, // { [fileId]: code }
      activeFileId,
      users: [],
      cursors: {},
    });
  }
  return rooms.get(roomId);
};

const addUser = (roomId, userInfo) => {
  const room = getRoom(roomId);
  if (!room) return;

  room.users = room.users.filter((u) => u.userId !== userInfo.userId);

  const alreadyExists = room.users.some((u) => u.socketId === userInfo.socketId);
  if (alreadyExists) return;

  const color = COLORS[room.users.length % COLORS.length];
  room.users.push({ ...userInfo, color });
};

const removeUser = (roomId, socketId) => {
  const room = getRoom(roomId);
  if (!room) return;
  room.users = room.users.filter((u) => u.socketId !== socketId);
  delete room.cursors[socketId];
  if (room.users.length === 0) rooms.delete(roomId);
};

const updateCode = (roomId, fileId, code) => {
  const room = getRoom(roomId);
  if (!room || !fileId) return;
  if (!room.files) room.files = {};
  room.files[String(fileId)] = code;
};

const getFileCode = (roomId, fileId) => {
  const room = getRoom(roomId);
  return room?.files?.[String(fileId)] ?? null;
};

const setActiveFile = (roomId, fileId) => {
  const room = getRoom(roomId);
  if (room) room.activeFileId = String(fileId);
};

const updateCursor = (roomId, socketId, position) => {
  const room = getRoom(roomId);
  if (room) room.cursors[socketId] = position;
};

const persistAllFiles = async (roomId, File) => {
  const room = getRoom(roomId);
  if (!room?.files) return;

  const updates = Object.entries(room.files).map(([fileId, content]) =>
    File.findByIdAndUpdate(fileId, { content })
  );
  await Promise.all(updates);
};

module.exports = {
  initRoom,
  getRoom,
  addUser,
  removeUser,
  updateCode,
  getFileCode,
  setActiveFile,
  updateCursor,
  persistAllFiles,
};
