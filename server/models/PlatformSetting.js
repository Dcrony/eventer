const mongoose = require("mongoose");

const platformSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: "platform",
    },
    commissionPercent: {
      type: Number,
      default: 10,
      min: 0,
      max: 100,
    },
    withdrawalFeePercent: {
      type: Number,
      default: 2,
      min: 0,
      max: 100,
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    eventApprovalRequired: {
      type: Boolean,
      default: true,
    },
    tickiAiEnabled: {
      type: Boolean,
      default: true,
    },
    livestreamEnabled: {
      type: Boolean,
      default: true,
    },
    registrationEnabled: {
      type: Boolean,
      default: true,
    },
    featuredEventIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Event",
      default: [],
    },
    homepage: {
      heroTitle: { type: String, default: "Discover unforgettable events on TickiSpot" },
      heroSubtitle: { type: String, default: "A modern event platform for creators, communities, and fans." },
    },
    platformLimits: {
      freePlanEventLimit: { type: Number, default: 3, min: 0 },
      maxTeamMembersPerEvent: { type: Number, default: 10, min: 1 },
      maxFeaturedEvents: { type: Number, default: 12, min: 1 },
    },
    email: {
      supportEmail: { type: String, default: "" },
      operationsEmail: { type: String, default: "" },
    },
    cloudinary: {
      cloudName: { type: String, default: "" },
      folder: { type: String, default: "tickispot" },
    },
    referrals: {
      enabled: { type: Boolean, default: false },
      rewardAmount: { type: Number, default: 0, min: 0 },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("PlatformSetting", platformSettingSchema);
