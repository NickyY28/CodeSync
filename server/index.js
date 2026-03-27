const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const roomRoutes = require("./routes/rooms");

const app = express();

// Middleware
app.use(cors({ origin: "http://localhost:5173" })); // Vite's default port
app.use(express.json()); // parse incoming JSON bodies

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);

// Connect to MongoDB then start server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(process.env.PORT || 5000, () =>
      console.log(`Server running on port ${process.env.PORT || 5000}`)
    );
  })
  .catch((err) => console.error(err));

// **Why `.connect().then()` starts the server inside it?** Because you want to guarantee MongoDB is ready before you accept any requests. If you start the server and connect separately, a request could come in before the DB is ready and crash.
