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
    location: {
  type: String,
  default: "Tickispot",
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
      default: "organizer",
    },
    isSuspended: {
      type: Boolean,
      default: false,
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
      sessionVersion: { type: Number, default: 0 },
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
        accountId: { type: String, default: "" },
        accountEmail: { type: String, default: "" },
        connectedAt: { type: Date, default: null },
      },
      googleCalendar: {
        connected: { type: Boolean, default: false },
        label: { type: String, default: "Not connected" },
        accessToken: { type: String, default: "" },
        refreshToken: { type: String, default: "" },
        scope: { type: String, default: "" },
        expiryDate: { type: Date, default: null },
        calendarEmail: { type: String, default: "" },
        connectedAt: { type: Date, default: null },
      },
      zoom: {
        connected: { type: Boolean, default: false },
        label: { type: String, default: "Not connected" },
        accessToken: { type: String, default: "" },
        refreshToken: { type: String, default: "" },
        scope: { type: String, default: "" },
        expiryDate: { type: Date, default: null },
        accountId: { type: String, default: "" },
        accountEmail: { type: String, default: "" },
        connectedAt: { type: Date, default: null },
      },
    },
    billing: {
      plan: { type: String, default: "Free" },
      cycle: {
        type: String,
        enum: ["monthly", "yearly"],
        default: "monthly",
      },
      nextBillingDate: { type: Date, default: null },
      paystackCustomerCode: { type: String, default: "" },
      lastPaymentReference: { type: String, default: "" },
      billingStatus: {
        type: String,
        enum: ["inactive", "active", "pending"],
        default: "inactive",
      },
    },
    subscription: {
      status: {
        type: String,
        enum: ["active", "cancelled", "expired", "pending", "inactive"],
        default: "inactive",
      },
      interval: {
        type: String,
        enum: ["monthly", "yearly"],
        default: "monthly",
      },
      nextBillingDate: {
        type: Date,
        default: null,
      },
      paystackCustomerId: {
        type: String,
        default: "",
      },
      paystackSubscriptionCode: {
        type: String,
        default: "",
      },
    },

    /** SaaS subscription tier */
    plan: {
      type: String,
      enum: ["free", "trial", "pro"],
      default: "free",
      set: (value) => {
        const normalized = String(value || "").trim().toLowerCase();
        return normalized === "business" ? "pro" : normalized || "free";
      },
    },
    trialEndsAt: {
      type: Date,
      default: null,
    },
    subscriptionStatus: {
      type: String,
      enum: ["inactive", "trialing", "active", "cancelled", "expired", "past_due"],
      default: "inactive",
    },
    paymentProviderId: {
      type: String,
      default: "",
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
          enum: ["free", "trial", "pro"],
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
        status: {
          type: String,
          enum: ["pending", "success", "failed", "cancelled", "expired"],
          default: "success",
        },
        reference: {
          type: String,
          default: "",
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
