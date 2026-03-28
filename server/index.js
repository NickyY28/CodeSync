const express = require("express"); // import Express framework to create server
const cors = require("cors"); // import CORS to allow frontend-backend communication
require("dotenv").config(); // load environment variables from .env file into process.env

const authRoutes = require("./routes/auth"); // import authentication routes (login/signup)
const roomRoutes = require("./routes/rooms"); // import room-related routes (create/join rooms)
const connectDB = require("./db/connect")

const app = express(); // create an Express application instance

// Middleware
app.use(cors({ origin: "http://localhost:5173" }));
// allow requests only from frontend (Vite runs on port 5173)

app.use(express.json());
// parse incoming JSON data from requests (req.body usable banata hai)

// Routes
app.use("/api/auth", authRoutes);
// all auth routes will be prefixed with /api/auth (e.g., /api/auth/login)

app.use("/api/rooms", roomRoutes);
// all room routes will be prefixed with /api/rooms (e.g., /api/rooms/create)


connectDB().then(() => {
  app.listen(process.env.PORT || 5000, () =>
  console.log(`Server running on port ${process.env.PORT || 5000}`)
  );
}); 



// Why `.connect().then()` starts the server inside it? Because you want to guarantee MongoDB is ready before you accept any requests. If you start the server and connect separately, a request could come in before the DB is ready and crash.
