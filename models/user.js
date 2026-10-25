const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  }
});

// passport-local-mongoose adds a username and safely hashed password support.
userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);
