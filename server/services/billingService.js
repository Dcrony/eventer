const BillingHistory = require("../models/BillingHistory");
const { PLAN_TYPES } = require("./subscriptionService");

const PLAN_CONFIG = {
  [PLAN_TYPES.FREE]: { monthly: 0, yearly: 0, displayName: "Free" },
  [PLAN_TYPES.PRO]: { monthly: 4999, yearly: 49990, displayName: "Pro" },
};

const normalizePlan = (plan) => {
  const normalized = String(plan || "").trim().toLowerCase();
  if (normalized === "business") return PLAN_TYPES.PRO;
  if (normalized === PLAN_TYPES.TRIAL) return PLAN_TYPES.TRIAL;
  return Object.prototype.hasOwnProperty.call(PLAN_CONFIG, normalized) ? normalized : PLAN_TYPES.FREE;
};

const normalizeInterval = (interval) => {
  const value = String(interval || "").trim().toLowerCase();
  if (value === "annually" || value === "annual") return "yearly";
  return value === "yearly" ? "yearly" : "monthly";
};

const getPlanAmount = (plan, interval) => {
  const normalizedPlan = normalizePlan(plan);
  const normalizedInterval = normalizeInterval(interval);
  return PLAN_CONFIG[normalizedPlan]?.[normalizedInterval];
};

const getPlanDisplayName = (plan) => {
  if (normalizePlan(plan) === PLAN_TYPES.TRIAL) return "Trial";
  return PLAN_CONFIG[normalizePlan(plan)]?.displayName || "Free";
};

const addBillingCycle = (startDate, interval) => {
  const nextBillingDate = new Date(startDate);
  if (normalizeInterval(interval) === "yearly") {
    nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
  } else {
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
  }
  return nextBillingDate;
};

const sanitizeUser = (user) => {
  const safeUser = user.toObject ? user.toObject() : { ...user };
  delete safeUser.password;
  delete safeUser.verificationCode;
  delete safeUser.verificationCodeExpires;
  delete safeUser.resetPasswordToken;
  delete safeUser.resetPasswordExpires;
  delete safeUser.emailVerificationToken;
  if (safeUser.integrations?.googleCalendar) {
    delete safeUser.integrations.googleCalendar.accessToken;
    delete safeUser.integrations.googleCalendar.refreshToken;
  }
  if (safeUser.integrations?.zoom) {
    delete safeUser.integrations.zoom.accessToken;
    delete safeUser.integrations.zoom.refreshToken;
  }
  return safeUser;
};

const syncUserBillingState = async ({
  user,
  plan,
  interval,
  status,
  reference,
  customerCode = "",
  subscriptionCode = "",
  effectiveDate = new Date(),
}) => {
  const normalizedPlan = normalizePlan(plan);
  const normalizedInterval = normalizeInterval(interval);
  const normalizedStatus = String(status || "active").toLowerCase();
  const amount = getPlanAmount(normalizedPlan, normalizedInterval) || 0;
  const nextBillingDate =
    normalizedPlan === PLAN_TYPES.FREE || normalizedStatus === "cancelled"
      ? null
      : addBillingCycle(effectiveDate, normalizedInterval);

  user.plan = normalizedPlan || PLAN_TYPES.FREE;
  user.subscriptionStatus = normalizedPlan === PLAN_TYPES.PRO ? "active" : "inactive";
  user.paymentProviderId =
    customerCode || subscriptionCode || user.paymentProviderId || "";
  user.subscription = {
    ...user.subscription?.toObject?.(),
    status:
      normalizedPlan === PLAN_TYPES.FREE
        ? "inactive"
        : ["active", "cancelled", "expired", "pending", "inactive"].includes(normalizedStatus)
          ? normalizedStatus
          : "active",
    interval: normalizedInterval,
    nextBillingDate,
    paystackCustomerId: customerCode || user.subscription?.paystackCustomerId || "",
    paystackSubscriptionCode: subscriptionCode || user.subscription?.paystackSubscriptionCode || "",
  };
  user.billing = {
    ...user.billing?.toObject?.(),
    plan: getPlanDisplayName(normalizedPlan),
    cycle: normalizedInterval,
    nextBillingDate,
    lastPaymentReference: reference || user.billing?.lastPaymentReference || "",
    paystackCustomerCode: customerCode || user.billing?.paystackCustomerCode || "",
    billingStatus:
      normalizedPlan === PLAN_TYPES.FREE
        ? "inactive"
        : normalizedStatus === "pending"
          ? "pending"
          : normalizedStatus === "active"
            ? "active"
            : "inactive",
  };
  user.subscriptionHistory = user.subscriptionHistory || [];
  if (reference && !user.subscriptionHistory.some((item) => item?.reference === reference)) {
    user.subscriptionHistory.unshift({
      plan: normalizedPlan,
      amount,
      interval: normalizedInterval,
      status:
        normalizedPlan === PLAN_TYPES.FREE
          ? "cancelled"
          : normalizedStatus === "active"
            ? "success"
            : normalizedStatus,
      reference,
      changedAt: effectiveDate,
    });
  }
  await user.save();

  return {
    user,
    nextBillingDate,
    amount,
  };
};

const upsertBillingHistory = async ({
  userId,
  plan,
  amount,
  interval,
  status,
  reference,
  paystackCustomerId = "",
  paystackSubscriptionCode = "",
  metadata = {},
}) =>
  BillingHistory.findOneAndUpdate(
    { reference },
    {
      userId,
      plan: normalizePlan(plan),
      amount: Number(amount || 0),
      interval: normalizeInterval(interval),
      status,
      reference,
      paystackCustomerId,
      paystackSubscriptionCode,
      metadata,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

module.exports = {
  PLAN_CONFIG,
  normalizePlan,
  normalizeInterval,
  getPlanAmount,
  getPlanDisplayName,
  addBillingCycle,
  sanitizeUser,
  syncUserBillingState,
  upsertBillingHistory,
};
