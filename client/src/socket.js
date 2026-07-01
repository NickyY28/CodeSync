import { io } from "socket.io-client";

let activeRoomId = null;

const socket = io("http://localhost:5000", {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  auth: {
    get token() {
      return localStorage.getItem("token");
    },
  },
});

const joinActiveRoom = () => {
  if (activeRoomId && socket.connected) {
    socket.emit("room:join", { roomId: activeRoomId });
  }
};

socket.on("connect", joinActiveRoom);

/** Track which room the client is in; re-join automatically on connect/reconnect. */
export const setActiveRoomId = (roomId) => {
  activeRoomId = roomId;
  if (roomId) {
    if (!socket.connected) socket.connect();
    else joinActiveRoom();
  }
};

export const leaveActiveRoom = () => {
  if (activeRoomId) {
    socket.emit("room:leave", { roomId: activeRoomId });
    activeRoomId = null;
  }
};

export default socket;
