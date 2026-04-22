const express = require("express"); // import Express framework to create server
const cors = require("cors"); // import CORS to allow frontend-backend communication
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config(); // load environment variables from .env file into process.env
const executeRoute = require("./routes/execute");

const authRoutes = require("./routes/auth"); // import authentication routes (login/signup)
const roomRoutes = require("./routes/rooms"); // import room-related routes (create/join rooms)
const connectDB = require("./db/connect")
const { initSocketHandlers } = require("./socket/socketHandlers");

const app = express(); // create an Express application instance

// Socket.io needs to attach to a raw HTTP server, not the Express app.
// app.listen() creates one internally, but you can't access it.
// http.createServer(app) gives you that server explicitly.
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
    cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
})
// Middleware
app.use(cors({ origin: "http://localhost:5173" }));
// allow requests only from frontend (Vite runs on port 5173)

app.use(express.json());
// express.json() Frontend se jo bhi Data aayega usko saaf suthra karke aage code ke liye req.body mein convert karega. Iske bina frontend ka bheja Data server padh nahi paayega.

// Routes
app.use("/api/auth", authRoutes);
// all auth routes will be prefixed with /api/auth (e.g., /api/auth/login)

app.use("/api/rooms", roomRoutes);
// all room routes will be prefixed with /api/rooms (e.g., /api/rooms/create)

app.use("/api/execute", executeRoute);

// ── JWT guard on every socket connection ─────
const jwt = require("jsonwebtoken");

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("No token"));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded; // attach to socket — available in all handlers
    next();
  } catch {
    next(new Error("Invalid token"));
  }
});
// ── Pass io into socket handlers ───────
initSocketHandlers(io);
/*Logic: io.use() socket par ek guard laga deta hai.
Koi bhi insaan Frontend se jab socket connect karega, to use token (Entry Pass) dena hoga.
Hum JWT se check karenge ki pass asli hai kya? Agar original hai, to us pass ke andar jo User ki info hai usko socket.user = decoded mein daal lenge. (Taki baad mein pata rahe kon likh raha hai code).
next() ka matlab hai "Sab theek hai, ab andar jaane do/connect hone do".
Uske baad ye verified insaan initSocketHandlers(io) file ke paas jayega apne event chalane.
*/

connectDB().then(() => {
  httpServer.listen(process.env.PORT || 5000, () =>
  console.log(`Server running on port ${process.env.PORT || 5000}`)
  );
}); 



// Why `.connect().then()` starts the server inside it? Because you want to guarantee MongoDB is ready before you accept any requests. If you start the server and connect separately, a request could come in before the DB is ready and crash.

/*Why http.createServer(app) instead of app.listen()? Socket.io needs to attach to a Node http.Server instance to intercept the WebSocket upgrade handshake. app.listen() creates one internally but doesn't expose it. http.createServer(app) gives you the server reference explicitly so you can pass it to new Server(httpServer).
Why io.use() and not per-event auth? The middleware runs once at connection time — before any event fires. If the token is invalid, the connection is rejected outright. This is far better than checking auth inside every single event handler.
*/