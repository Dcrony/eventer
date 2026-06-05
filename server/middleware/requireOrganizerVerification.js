/**
 * Middleware to check organizer verification status
 * Should be applied after authMiddleware
 * 
 * Usage:
 *   - requireOrganizerVerification() - Require verified status, block unverified
 *   - requireOrganizerVerification('soft') - Only check, don't block (for warnings)
 *   - requireOrganizerVerification('publish') - Allow draft by unverified, block publish
 */

const OrganizerVerification = require("../models/OrganizerVerification");
const User = require("../models/User");

exports.requireOrganizerVerification = (mode = "strict") => {
  return async (req, res, next) => {
    try {
      // Only apply to organizers
      if (!req.user || req.user.role !== "organizer") {
        return next();
      }

      // Get verification status
      const verification = await OrganizerVerification.findOne({ 
        organizer: req.user._id 
      }).sort({ createdAt: -1 });

      // Attach to request for downstream use
      req.organizerVerification = verification;
      req.isOrganizerVerified = verification?.status === "approved";
      req.verificationStatus = verification?.status || "not_started";

      if (mode === "soft") {
        // Just attach, don't block
        return next();
      }

      if (mode === "strict") {
        // Block unverified organizers completely
        if (!req.isOrganizerVerified) {
          return res.status(403).json({
            message: "Organizer verification required",
            code: "NOT_VERIFIED",
            status: req.verificationStatus,
            rejectionReason: verification?.rejectionReason || null,
          });
        }
        return next();
      }

      if (mode === "publish") {
        // Allow drafts, but block publish for unverified
        // This will be checked in the event controller
        return next();
      }

      next();
    } catch (error) {
      console.error("❌ ORGANIZER VERIFICATION MIDDLEWARE ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  };
};

/**
 * Helper to get verification status info
 */
exports.getVerificationStatus = async (userId) => {
  try {
    const verification = await OrganizerVerification.findOne({ 
      organizer: userId 
    }).sort({ createdAt: -1 });

    if (!verification) {
      return {
        status: "not_started",
        isVerified: false,
        documents: [],
      };
    }

    return {
      status: verification.status,
      isVerified: verification.status === "approved",
      documents: verification.documents || [],
      rejectionReason: verification.rejectionReason,
      reviewedAt: verification.reviewedAt,
      createdAt: verification.createdAt,
    };
  } catch (error) {
    console.error("❌ GET VERIFICATION STATUS ERROR:", error);
    return {
      status: "error",
      isVerified: false,
      documents: [],
    };
  }
};
