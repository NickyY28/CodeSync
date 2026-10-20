const express = require("express"); // import Express framework to create server
const cors = require("cors"); // import CORS to allow frontend-backend communication
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config(); // load environment variables from .env file into process.env
const connectDB = require("./db/connect");
const { initSocketHandlers } = require("./socket/socketHandlers");

const app = express(); // create an Express application instance

const port = process.env.PORT || 3000; // use PORT from environment or default to 3000
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173"; // default to Vite dev server

// Socket.io needs to attach to a raw HTTP server, not the Express app.
// app.listen() creates one internally, but you can't access it.
// http.createServer(app) gives you that server explicitly.
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: frontendUrl,
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// Middleware
app.use(cors({ origin: frontendUrl }));
app.use(express.json());

// Root and health check routes
app.get("/", (_, res) => res.send("Server is running"));
app.get("/health", (_, res) => res.send("Server is healthy"));

// Routes
const executeRoute = require("./routes/execute");
const authRoutes = require("./routes/auth"); // import authentication routes (login/signup)
const roomRoutes = require("./routes/rooms"); // import room-related routes (create/join rooms)
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
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

connectDB().then(() => {
  httpServer.listen(port, () =>
    console.log(`Server running on port ${port} and connected to DB`),
  );
});
