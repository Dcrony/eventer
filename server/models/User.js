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
    
    // 🔐 OTP verification fields
    verificationCode: String,
    verificationCodeExpires: Date,
    
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
favorites: {
  type: [mongoose.Schema.Types.ObjectId],
  ref: "Event",
  default: [],
},

    // ✅ Settings sections
    privacy: {
      showProfile: { type: Boolean, default: true },
      showActivity: { type: Boolean, default: false },
      searchable: { type: Boolean, default: true },
    },
    notifications: {
      likes: { type: Boolean, default: true },
      comments: { type: Boolean, default: true },
      follows: { type: Boolean, default: true },
      eventReminders: { type: Boolean, default: true },
      emailAlerts: { type: Boolean, default: true },
      smsAlerts: { type: Boolean, default: false },
      appPush: { type: Boolean, default: true },
      newsletter: { type: Boolean, default: false },
    },
    security: {
      twoFactorEnabled: { type: Boolean, default: false },
      lastPasswordChange: { type: Date, default: null },
    },
    eventPreferences: {
      defaultTicketPrice: { type: Number, default: 0 },
      eventVisibility: {
        type: String,
        enum: ["public", "private"],
        default: "public",
      },
      autoPublishEvents: { type: Boolean, default: false },
    },
    integrations: {
      stripe: {
        connected: { type: Boolean, default: false },
        label: { type: String, default: "Not connected" },
      },
      googleCalendar: {
        connected: { type: Boolean, default: false },
        label: { type: String, default: "Not connected" },
      },
      zoom: {
        connected: { type: Boolean, default: false },
        label: { type: String, default: "Not connected" },
      },
    },
    billing: {
      plan: { type: String, default: "Free" },
      nextBillingDate: { type: String, default: "N/A" },
    },

    /** SaaS subscription tier (separate from legacy billing.plan label) */
    plan: {
      type: String,
      enum: ["free", "pro", "business"],
      default: "free",
    },
    /** Total events ever created (incremented on each create) */
    eventCount: {
      type: Number,
      default: 0,
    },
    subscriptionHistory: [
      {
        plan: {
          type: String,
          enum: ["free", "pro", "business"],
          required: true,
        },
        amount: {
          type: Number,
          default: 0,
        },
        interval: {
          type: String,
          enum: ["monthly", "yearly"],
          default: "monthly",
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

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
