const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    bio: {
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
    phone: {
      type: String,
      required: false,
      unique: false,
    },
    password: {
      type: String,
      required: false,
      validate: {
        validator(v) {
          if (v == null || v === "") return true;
          return String(v).length >= 6;
        },
        message: "Password must be at least 6 characters",
      },
    },
    firebaseUid: {
      type: String,
      sparse: true,
      unique: true,
      index: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    googleId: String,
    role: {
      type: String,
      enum: ["admin", "organizer", "user"],
      default: "user",
    },
    coverPic: {
      type: String,
      default: "1754696275588.jpg",
    },
    profilePic: {
      type: String,
      default: "1754696275588.jpg",
    },

    availableBalance: {
      type: Number,
      default: 0,
    },

    pendingBalance: {
      type: Number,
      default: 0,
    },

   following: {
  type: [mongoose.Schema.Types.ObjectId],
  ref: "User",
  default: [],
},
followers: {
  type: [mongoose.Schema.Types.ObjectId],
  ref: "User",
  default: [],
},

    // ✅ Settings sections
    privacy: {
      showProfile: { type: Boolean, default: true },
      showActivity: { type: Boolean, default: false },
      searchable: { type: Boolean, default: true },
    },
    notifications: {
      emailAlerts: { type: Boolean, default: true },
      smsAlerts: { type: Boolean, default: false },
      appPush: { type: Boolean, default: true },
      newsletter: { type: Boolean, default: false },
    },
    billing: {
      plan: { type: String, default: "Free" },
      nextBillingDate: { type: String, default: "N/A" },
    },

    isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: Date,
  },
  { timestamps: true },
);

// 🔑 Virtual boolean fields for quick checks
UserSchema.virtual("isAdmin").get(function () {
  return this.role === "admin";
});

UserSchema.virtual("isOrganizer").get(function () {
  return this.role === "organizer";
});

module.exports = mongoose.model("User", UserSchema);
