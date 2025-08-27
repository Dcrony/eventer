const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    boi:{
      type: String,
      required: false,
      unique: false,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["admin", "organizer", "user"],
      default: "user",
    },
    profilePic: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// 🔑 Virtual boolean fields for quick checks
UserSchema.virtual("isAdmin").get(function () {
  return this.role === "admin";
});

UserSchema.virtual("isOrganizer").get(function () {
  return this.role === "organizer";
});

module.exports = mongoose.model("User", UserSchema);
