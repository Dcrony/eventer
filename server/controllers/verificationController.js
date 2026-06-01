const OrganizerVerification = require("../models/OrganizerVerification");
const User = require("../models/User");
const { uploadImageBuffer, cloudinary } = require("../utils/cloudinaryMedia");
const { uploadImageMemory } = require("../middleware/imageUploadMemory");

// Submit verification documents (organizer only)
exports.submitVerification = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "organizer") {
      return res.status(403).json({ message: "Only organizers can submit verification." });
    }

    // files uploaded via multer memory storage
    const files = req.files || [];
    const typesPayload = req.body.types || null; // optional JSON string
    let types = [];
    try {
      if (typeof typesPayload === "string") types = JSON.parse(typesPayload);
      else if (Array.isArray(typesPayload)) types = typesPayload;
    } catch (e) {
      types = [];
    }

    if (!files.length) {
      return res.status(400).json({ message: "At least one document is required to submit verification." });
    }

    const uploadPromises = files.map(async (file, idx) => {
      const folder = `eventer/verification/${req.user._id}`;
      const result = await uploadImageBuffer(file.buffer, { folder });
      return {
        type: types[idx] || file.fieldname || "document",
        url: result.secure_url || result.url || "",
        publicId: result.public_id || null,
        filename: file.originalname || "",
        uploadedAt: new Date(),
      };
    });

    const documents = await Promise.all(uploadPromises);

    // snapshot some metrics
    const now = new Date();
    const accountAgeDays = Math.max(0, Math.floor((now - (req.user.createdAt || now)) / (1000 * 60 * 60 * 24)));

    const existing = await OrganizerVerification.findOne({ organizer: req.user._id }).sort({ createdAt: -1 });

    if (existing && existing.status === "pending") {
      // mark as resubmitted
      existing.status = "resubmitted";
      existing.documents = existing.documents.concat(documents);
      existing.metricsSnapshot = {
        eventsCompleted: req.user.eventCount || 0,
        totalTicketsSold: req.user.eventCount || 0,
        accountAgeDays,
      };
      await existing.save();
      return res.json({ success: true, verification: existing });
    }

    const verification = await OrganizerVerification.create({
      organizer: req.user._id,
      documents,
      status: "pending",
      metricsSnapshot: {
        eventsCompleted: req.user.eventCount || 0,
        totalTicketsSold: req.user.eventCount || 0,
        accountAgeDays,
      },
    });

    return res.json({ success: true, verification });
  } catch (error) {
    console.error("submitVerification error:", error);
    return res.status(500).json({ message: "Failed to submit verification" });
  }
};

exports.getMyVerification = async (req, res) => {
  try {
    const verification = await OrganizerVerification.findOne({ organizer: req.user._id }).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, verification });
  } catch (error) {
    console.error("getMyVerification error:", error);
    return res.status(500).json({ message: "Failed to fetch verification status" });
  }
};

// Admin: list verification requests
exports.adminList = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (Math.max(Number(page), 1) - 1) * Number(limit);
    const filter = {};
    if (status) filter.status = status;

    const [items, total] = await Promise.all([
      OrganizerVerification.find(filter).populate("organizer", "name email username role isSuspended").sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      OrganizerVerification.countDocuments(filter),
    ]);

    return res.json({ success: true, items, pagination: { page: Number(page), limit: Number(limit), total } });
  } catch (error) {
    console.error("adminList verification error:", error);
    return res.status(500).json({ message: "Failed to fetch verification queue" });
  }
};

// Admin: review (approve/reject)
exports.adminReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason = "" } = req.body; // action: approve|reject

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ message: "Invalid action" });
    }

    const verification = await OrganizerVerification.findById(id);
    if (!verification) return res.status(404).json({ message: "Verification request not found" });

    if (action === "approve") {
      verification.status = "approved";
      verification.rejectionReason = "";
      verification.reviewedBy = req.user._id;
      verification.reviewedAt = new Date();
      await verification.save();

      // mark user verified
      await User.findByIdAndUpdate(verification.organizer, { $set: { isVerified: true } });
    } else {
      verification.status = "rejected";
      verification.rejectionReason = reason || "Not sufficient documentation";
      verification.reviewedBy = req.user._id;
      verification.reviewedAt = new Date();
      await verification.save();

      // ensure user remains unverified
      await User.findByIdAndUpdate(verification.organizer, { $set: { isVerified: false } });
    }

    return res.json({ success: true, verification });
  } catch (error) {
    console.error("adminReview error:", error);
    return res.status(500).json({ message: "Failed to review verification" });
  }
};

exports.getVerificationById = async (req, res) => {
  try {
    const { id } = req.params;
    const verification = await OrganizerVerification.findById(id).populate("organizer", "name email username role isSuspended").lean();
    if (!verification) return res.status(404).json({ message: "Verification request not found" });
    return res.json({ success: true, verification });
  } catch (error) {
    console.error("getVerificationById error:", error);
    return res.status(500).json({ message: "Failed to fetch verification request" });
  }
};
