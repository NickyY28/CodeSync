import { io } from "socket.io-client";

// Create socket instance but don't connect yet — 
// connection happens when user enters a room
// autoConnect: false means it won't try to connect on import
const socket = io("http://localhost:5000", {
  autoConnect: false,
  auth: {
    // Token is read at connect-time, not at import-time
    // So by the time this runs, the token is in localStorage
    get token() {
      return localStorage.getItem("token");
    },
  },
});

export default socket;