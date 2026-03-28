const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,         // removes accidental spaces
      minlength: 3,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,    // always store emails lowercase
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
  },
  { timestamps: true }   // adds createdAt and updatedAt automatically
);

module.exports = mongoose.model("User", userSchema);

// Mongoose.Schema() is a class that is used to create a schema for a model
// mongoose.model("User", userSchema)
// This part takes the blueprint you just wrote (userSchema) and complies it into a fully functional Model.

// A Schema is just the design (the blueprint).
// A Model is the actual machine (the factory) that uses the blueprint to create, read, update, and delete documents in your database.
// The "User" argument tells Mongoose what to name the model. Mongoose is smart, so it takes the string "User", converts it to lowercase, and makes it plural. This means it will automatically link this model to a collection named users inside your MongoDB database.
// Summary:
// mongoose.model("User", userSchema) converts your schema blueprint into a working tool (Model) that binds to the users collection in MongoDB. module.exports then shares this tool with the rest of your application so it can be imported and used elsewhere.