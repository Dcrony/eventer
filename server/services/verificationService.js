const OrganizerVerification = require("../models/OrganizerVerification");

const ORGANIZER_VERIFICATION_STATUSES = Object.freeze([
  "not_started",
  "pending",
  "approved",
  "rejected",
]);

const normalizeOrganizerVerificationStatus = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  return ORGANIZER_VERIFICATION_STATUSES.includes(normalized) ? normalized : "not_started";
};

const getLatestOrganizerVerification = async (userId) =>
  OrganizerVerification.findOne({ organizer: userId }).sort({ createdAt: -1 }).lean();

const getOrganizerVerificationSnapshot = async (user, options = {}) => {
  if (!user) {
    return {
      status: "not_started",
      isVerified: false,
      verifiedAt: null,
      verifiedBy: null,
      reviewedAt: null,
      submittedAt: null,
      rejectionReason: "",
      documents: [],
    };
  }

  const base = {
    status: normalizeOrganizerVerificationStatus(user.organizerVerificationStatus),
    isVerified: normalizeOrganizerVerificationStatus(user.organizerVerificationStatus) === "approved",
    verifiedAt: user.organizerVerifiedAt || null,
    verifiedBy: user.organizerVerifiedBy || null,
    reviewedAt: user.organizerVerificationReviewedAt || null,
    submittedAt: user.organizerVerificationSubmittedAt || null,
    rejectionReason: user.organizerVerificationRejectionReason || "",
    documents: [],
  };

  if (base.status !== "not_started" || options.skipLegacyLookup) {
    return base;
  }

  const legacyVerification = await getLatestOrganizerVerification(user._id || user.id);
  if (!legacyVerification) {
    return base;
  }

  return {
    status: normalizeOrganizerVerificationStatus(legacyVerification.status),
    isVerified: legacyVerification.status === "approved",
    verifiedAt: legacyVerification.status === "approved" ? legacyVerification.reviewedAt || legacyVerification.updatedAt || legacyVerification.createdAt : null,
    verifiedBy: legacyVerification.status === "approved" ? legacyVerification.reviewedBy || null : null,
    reviewedAt: legacyVerification.reviewedAt || null,
    submittedAt: legacyVerification.createdAt || null,
    rejectionReason: legacyVerification.rejectionReason || "",
    documents: legacyVerification.documents || [],
    verificationId: legacyVerification._id,
  };
};

const applyOrganizerVerificationState = ({
  user,
  status,
  reviewerId = null,
  reviewedAt = new Date(),
  rejectionReason = "",
  submittedAt = null,
}) => {
  if (!user) return user;

  const normalizedStatus = normalizeOrganizerVerificationStatus(status);
  user.organizerVerificationStatus = normalizedStatus;
  user.organizerVerificationReviewedAt = reviewedAt;
  user.organizerVerificationSubmittedAt = submittedAt || user.organizerVerificationSubmittedAt || null;
  user.organizerVerificationRejectionReason = normalizedStatus === "rejected" ? rejectionReason : "";
  user.organizerVerificationRejectedAt = normalizedStatus === "rejected" ? reviewedAt : null;
  user.organizerVerifiedAt = normalizedStatus === "approved" ? reviewedAt : null;
  user.organizerVerifiedBy = normalizedStatus === "approved" ? reviewerId : null;
  return user;
};

module.exports = {
  ORGANIZER_VERIFICATION_STATUSES,
  normalizeOrganizerVerificationStatus,
  getLatestOrganizerVerification,
  getOrganizerVerificationSnapshot,
  applyOrganizerVerificationState,
};
