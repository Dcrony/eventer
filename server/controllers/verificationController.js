const OrganizerVerification = require("../models/OrganizerVerification");
const User = require("../models/User");
const ActivityLog = require("../models/ActivityLog");
const { uploadImageBuffer, cloudinary } = require("../utils/cloudinaryMedia");
const { uploadImageMemory } = require("../middleware/imageUploadMemory");
const sendEmail = require("../utils/email");
const { createNotification } = require("../services/notificationService");
const { applyOrganizerVerificationState } = require("../services/verificationService");
const {
  verificationRequestNotificationEmail,
  verificationApprovedEmail,
  verificationRejectedEmail,
  verificationResubmissionRequestEmail,
  verificationSuspendedEmail,
} = require("../utils/emailTemplates");

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "tickispot@gmail.com";
const FRONTEND_URL = process.env.FRONTEND_URL || "https://tickispot.com";

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
      const result = await uploadImageBuffer(file.buffer, { folder }, file.mimetype);
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

      await User.findByIdAndUpdate(req.user._id, {
        $set: {
          organizerVerificationStatus: "pending",
          organizerVerificationSubmittedAt: new Date(),
          organizerVerificationReviewedAt: null,
          organizerVerificationRejectedAt: null,
          organizerVerificationRejectionReason: "",
          organizerVerifiedAt: null,
          organizerVerifiedBy: null,
        },
      });

      sendEmail({
        to: ADMIN_EMAIL,
        subject: "Organizer verification resubmitted",
        html: verificationRequestNotificationEmail(
          req.user.name || "Organizer",
          req.user.email,
          existing._id,
          existing.documents.length,
          `${FRONTEND_URL}/admin/verification/${existing._id}`,
        ),
        type: "organizer_verification_resubmitted",
        relatedType: "OrganizerVerification",
        relatedId: existing._id,
        metadata: {
          organizerId: String(req.user._id),
          documentCount: existing.documents.length,
        },
      }).catch((err) => console.error("Verification resubmit email failed:", err));

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

    await User.findByIdAndUpdate(req.user._id, {
      $set: {
        organizerVerificationStatus: "pending",
        organizerVerificationSubmittedAt: new Date(),
        organizerVerificationReviewedAt: null,
        organizerVerificationRejectedAt: null,
        organizerVerificationRejectionReason: "",
        organizerVerifiedAt: null,
        organizerVerifiedBy: null,
      },
    });

    sendEmail({
      to: ADMIN_EMAIL,
      subject: "New organizer verification request received",
      html: verificationRequestNotificationEmail(
        req.user.name || "Organizer",
        req.user.email,
        verification._id,
        documents.length,
        `${FRONTEND_URL}/admin/verification/${verification._id}`,
      ),
      type: "organizer_verification_request",
      relatedType: "OrganizerVerification",
      relatedId: verification._id,
      metadata: {
        organizerId: String(req.user._id),
        documentCount: documents.length,
      },
    }).catch((err) => console.error("Verification request email failed:", err));

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

    const [items, total, statsAgg] = await Promise.all([
      OrganizerVerification.find(filter)
        .populate("organizer", "name email username role isSuspended")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      OrganizerVerification.countDocuments(filter),
      OrganizerVerification.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Convert aggregate array to flat object
    const stats = { pending: 0, approved: 0, rejected: 0, suspended: 0, resubmitted: 0 };
    for (const entry of statsAgg) {
      if (entry._id in stats) stats[entry._id] = entry.count;
    }
    // pending + resubmitted both count toward the pending badge
    stats.pending += stats.resubmitted;

    return res.json({
      success: true,
      items,
      pagination: { page: Number(page), limit: Number(limit), total },
      stats,
    });
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

    const organizer = await User.findById(verification.organizer).select("name email");

    if (action === "approve") {
      verification.status = "approved";
      verification.rejectionReason = "";
      verification.reviewedBy = req.user._id;
      verification.reviewedAt = new Date();
      await verification.save();

      const organizerUser = await User.findById(verification.organizer);
      if (organizerUser) {
        applyOrganizerVerificationState({
          user: organizerUser,
          status: "approved",
          reviewerId: req.user._id,
          reviewedAt: verification.reviewedAt,
          submittedAt: verification.createdAt,
        });
        await organizerUser.save();
      }

      if (organizer?.email) {
        sendEmail({
          to: organizer.email,
          subject: "Your organizer verification is approved",
          html: verificationApprovedEmail(
            organizer.name || "Organizer",
            `${FRONTEND_URL}/verification/me`,
          ),
          type: "organizer_verification_approved",
          relatedType: "OrganizerVerification",
          relatedId: verification._id,
          metadata: {
            organizerId: String(verification.organizer),
            reviewAction: "approve",
          },
        }).catch((err) => console.error("Verification approval email failed:", err));
      }
    } else {
      verification.status = "rejected";
      verification.rejectionReason = reason || "Not sufficient documentation";
      verification.reviewedBy = req.user._id;
      verification.reviewedAt = new Date();
      await verification.save();

      const organizerUser = await User.findById(verification.organizer);
      if (organizerUser) {
        applyOrganizerVerificationState({
          user: organizerUser,
          status: "rejected",
          reviewerId: req.user._id,
          reviewedAt: verification.reviewedAt,
          rejectionReason: verification.rejectionReason,
          submittedAt: verification.createdAt,
        });
        await organizerUser.save();
      }

      if (organizer?.email) {
        sendEmail({
          to: organizer.email,
          subject: "Your organizer verification has been declined",
          html: verificationRejectedEmail(
            organizer.name || "Organizer",
            verification.rejectionReason,
            `${FRONTEND_URL}/verification/me`,
          ),
          type: "organizer_verification_rejected",
          relatedType: "OrganizerVerification",
          relatedId: verification._id,
          metadata: {
            organizerId: String(verification.organizer),
            reviewAction: "reject",
            rejectionReason: verification.rejectionReason,
          },
        }).catch((err) => console.error("Verification rejection email failed:", err));
      }
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

// Admin: Request resubmission with specific instructions
exports.adminRequestResubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { instructions = "" } = req.body;

    if (!instructions || instructions.trim().length === 0) {
      return res.status(400).json({ message: "Resubmission instructions are required" });
    }

    const verification = await OrganizerVerification.findById(id);
    if (!verification) return res.status(404).json({ message: "Verification request not found" });

    const organizer = await User.findById(verification.organizer).select("name email");

    // Update verification status
    const previousStatus = verification.status;
    verification.status = "resubmission_required";
    verification.resubmissionInstructions = instructions;
    verification.reviewedBy = req.user._id;
    verification.reviewedAt = new Date();
    await verification.save();

    // Log admin activity
    await ActivityLog.create({
      adminId: req.user._id,
      action: "VERIFICATION_RESUBMISSION_REQUESTED",
      targetType: "OrganizerVerification",
      targetId: verification._id,
      details: `Resubmission requested for ${organizer?.name || "Organizer"}`,
      ipAddress: req.ip || null,
      meta: {
        actorRole: req.user.role,
        organizerId: String(verification.organizer),
        previousStatus,
        instructions: instructions.substring(0, 200),
      },
    }).catch((err) => console.error("Failed to log admin activity:", err));

    // Send notification to organizer
    if (organizer?.email) {
      sendEmail({
        to: organizer.email,
        subject: "Your organizer verification requires resubmission",
        html: verificationResubmissionRequestEmail(
          organizer.name || "Organizer",
          instructions,
          `${FRONTEND_URL}/verification/submit`,
        ),
        type: "organizer_verification_resubmission_requested",
        relatedType: "OrganizerVerification",
        relatedId: verification._id,
        metadata: {
          organizerId: String(verification.organizer),
          reviewAction: "resubmit",
        },
      }).catch((err) => console.error("Resubmission request email failed:", err));
    }

    // Create in-app notification
    createNotification({
      userId: verification.organizer,
      type: "verification_resubmission_requested",
      message: "Your verification requires resubmission. Please review the instructions and resubmit your documents.",
      actionUrl: `${FRONTEND_URL}/verification/submit`,
      entityId: verification._id,
      entityType: "OrganizerVerification",
      meta: { instructions },
    }).catch((err) => console.error("Failed to create notification:", err));

    return res.json({ success: true, verification });
  } catch (error) {
    console.error("adminRequestResubmission error:", error);
    return res.status(500).json({ message: "Failed to request resubmission" });
  }
};

// Admin: Suspend verification (mark as under investigation)
exports.adminSuspendVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = "", investigationNotes = "" } = req.body;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ message: "Suspension reason is required" });
    }

    const verification = await OrganizerVerification.findById(id);
    if (!verification) return res.status(404).json({ message: "Verification request not found" });

    const organizer = await User.findById(verification.organizer).select("name email");

    // Update verification status
    const previousStatus = verification.status;
    verification.status = "suspended";
    verification.suspension_reason = reason;
    verification.suspended_by = req.user._id;
    verification.suspended_at = new Date();
    verification.investigation_notes = investigationNotes || "";
    verification.reviewedBy = req.user._id;
    verification.reviewedAt = new Date();

    // Add verification attempt record
    if (!verification.verification_attempts) {
      verification.verification_attempts = [];
    }
    verification.verification_attempts.push({
      attemptNumber: verification.verification_attempts.length + 1,
      submittedAt: verification.createdAt,
      documentCount: verification.documents.length,
      status: "suspended",
      notes: reason,
    });

    await verification.save();

    // Add fraud flag if verification has high risk score
    if (verification.risk_score > 70) {
      const FraudFlag = require("../models/FraudFlag");
      await FraudFlag.updateOne(
        { targetId: verification.organizer, targetType: "User" },
        {
          $set: {
            targetId: verification.organizer,
            targetType: "User",
            flagReason: `Verification suspended: ${reason}`,
            severity: "high",
            flaggedBy: req.user._id,
            flaggedAt: new Date(),
          },
        },
        { upsert: true }
      ).catch((err) => console.error("Failed to create fraud flag:", err));
    }

    // Log admin activity
    await ActivityLog.create({
      adminId: req.user._id,
      action: "VERIFICATION_SUSPENDED",
      targetType: "OrganizerVerification",
      targetId: verification._id,
      details: `Verification suspended for ${organizer?.name || "Organizer"}: ${reason}`,
      ipAddress: req.ip || null,
      meta: {
        actorRole: req.user.role,
        organizerId: String(verification.organizer),
        previousStatus,
        suspensionReason: reason,
      },
    }).catch((err) => console.error("Failed to log admin activity:", err));

    // Send notification to organizer
    if (organizer?.email) {
      sendEmail({
        to: organizer.email,
        subject: "Your organizer verification is under review",
        html: verificationSuspendedEmail(
          organizer.name || "Organizer",
          reason,
          `${FRONTEND_URL}/verification/me`,
        ),
        type: "organizer_verification_suspended",
        relatedType: "OrganizerVerification",
        relatedId: verification._id,
        metadata: {
          organizerId: String(verification.organizer),
          suspensionReason: reason,
        },
      }).catch((err) => console.error("Suspension email failed:", err));
    }

    // Create in-app notification
    createNotification({
      userId: verification.organizer,
      type: "verification_suspended",
      message: `Your verification is under review. Reason: ${reason}`,
      actionUrl: `${FRONTEND_URL}/verification/me`,
      entityId: verification._id,
      entityType: "OrganizerVerification",
      meta: { reason },
    }).catch((err) => console.error("Failed to create notification:", err));

    return res.json({ success: true, verification });
  } catch (error) {
    console.error("adminSuspendVerification error:", error);
    return res.status(500).json({ message: "Failed to suspend verification" });
  }
};

// Admin: Restore verification (from suspended)
exports.adminRestoreVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { action = "requeue", notes = "" } = req.body; // action: requeue|approve|reject

    const verification = await OrganizerVerification.findById(id);
    if (!verification) return res.status(404).json({ message: "Verification request not found" });

    if (verification.status !== "suspended") {
      return res.status(400).json({ message: "Only suspended verifications can be restored" });
    }

    const organizer = await User.findById(verification.organizer).select("name email");
    const previousStatus = verification.status;

    if (action === "requeue") {
      // Put back to pending for review
      verification.status = "pending";
      verification.suspension_reason = "";
      verification.suspended_by = null;
      verification.suspended_at = null;
    } else if (action === "approve") {
      verification.status = "approved";
      verification.reviewedBy = req.user._id;
      verification.reviewedAt = new Date();
      verification.suspension_reason = "";
      verification.suspended_by = null;
      verification.suspended_at = null;
      const organizerUser = await User.findById(verification.organizer);
      if (organizerUser) {
        applyOrganizerVerificationState({
          user: organizerUser,
          status: "approved",
          reviewerId: req.user._id,
          reviewedAt: verification.reviewedAt,
          submittedAt: verification.createdAt,
        });
        await organizerUser.save();
      }
    } else if (action === "reject") {
      verification.status = "rejected";
      verification.rejectionReason = notes || "Verification rejected after review";
      verification.reviewedBy = req.user._id;
      verification.reviewedAt = new Date();
      verification.suspension_reason = "";
      verification.suspended_by = null;
      verification.suspended_at = null;
      const organizerUser = await User.findById(verification.organizer);
      if (organizerUser) {
        applyOrganizerVerificationState({
          user: organizerUser,
          status: "rejected",
          reviewerId: req.user._id,
          reviewedAt: verification.reviewedAt,
          rejectionReason: verification.rejectionReason,
          submittedAt: verification.createdAt,
        });
        await organizerUser.save();
      }
    } else {
      return res.status(400).json({ message: "Invalid action. Use: requeue, approve, or reject" });
    }

    await verification.save();

    // Log admin activity
    await ActivityLog.create({
      adminId: req.user._id,
      action: "VERIFICATION_RESTORED",
      targetType: "OrganizerVerification",
      targetId: verification._id,
      details: `Verification restored for ${organizer?.name || "Organizer"} with action: ${action}`,
      ipAddress: req.ip || null,
      meta: {
        actorRole: req.user.role,
        organizerId: String(verification.organizer),
        previousStatus,
        restorationAction: action,
      },
    }).catch((err) => console.error("Failed to log admin activity:", err));

    // Create in-app notification
    createNotification({
      userId: verification.organizer,
      type: "verification_status_updated",
      message: `Your verification has been ${action === "approve" ? "approved" : action === "reject" ? "rejected" : "requeued"}`,
      actionUrl: `${FRONTEND_URL}/verification/me`,
      entityId: verification._id,
      entityType: "OrganizerVerification",
    }).catch((err) => console.error("Failed to create notification:", err));

    return res.json({ success: true, verification });
  } catch (error) {
    console.error("adminRestoreVerification error:", error);
    return res.status(500).json({ message: "Failed to restore verification" });
  }
};

// Admin: Get verification audit history
exports.getVerificationAuditHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const verification = await OrganizerVerification.findById(id);
    if (!verification) return res.status(404).json({ message: "Verification request not found" });

    // Get all admin actions related to this verification
    const auditHistory = await ActivityLog.find({
      targetType: "OrganizerVerification",
      targetId: verification._id,
    })
      .populate("adminId", "name email role")
      .sort({ createdAt: -1 })
      .lean();

    // Also get all USER_VERIFIED/USER_UNVERIFIED actions for this organizer
    const userAuditHistory = await ActivityLog.find({
      action: { $in: ["USER_VERIFIED", "USER_UNVERIFIED"] },
      targetId: verification.organizer,
      targetType: "User",
      createdAt: {
        $gte: new Date(verification.createdAt.getTime() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      },
    })
      .populate("adminId", "name email role")
      .sort({ createdAt: -1 })
      .lean();

    const combinedHistory = [...auditHistory, ...userAuditHistory].sort((a, b) => b.createdAt - a.createdAt);

    return res.json({ success: true, auditHistory: combinedHistory });
  } catch (error) {
    console.error("getVerificationAuditHistory error:", error);
    return res.status(500).json({ message: "Failed to fetch audit history" });
  }
};
