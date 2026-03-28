const mongoose = require("mongoose"); // mongoose is a tool that helps communication b/w nodejs server and mongodb

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    process.exit(1); // kill the process — no point running server without DB
  }
};

module.exports = connectDB;

// why we used async await here? cause when we connect it takes time to connect so we use async await to wait for the connection to complete meanwhile other code can run and application doesn't freeze
// what is the purpose of await? await is used to wait for the promise to resolve and return the value of the promise if we don't use it then js won't wait for the connection to complete and will move on to the next line and hence give error before getting connected to the db