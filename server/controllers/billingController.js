const axios = require("axios");
const User = require("../models/User");
const BillingHistory = require("../models/BillingHistory");
const {
  PLAN_CONFIG,
  normalizePlan,
  normalizeInterval,
  getPlanAmount,
  sanitizeUser,
  syncUserBillingState,
  upsertBillingHistory,
} = require("../services/billingService");

const PAYSTACK_SECRET =
  process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL;
const BACKEND_URL = process.env.BACKEND_URL;

const getVerifyCallbackUrl = (reference) =>
  `${BACKEND_URL}/api/billing/redirect/${encodeURIComponent(reference)}`;

const buildBillingFeatures = (plan) => {
  const normalizedPlan = normalizePlan(plan);
  return {
    events: normalizedPlan === "free" ? "limited" : "unlimited",
    analytics: normalizedPlan === "free" ? "disabled" : "enabled",
    featuredPlacement: normalizedPlan === "business",
  };
};

const resolveAuthenticatedUser = async (req) => {
  return User.findById(req.user?._id || req.user?.id);
};

const createSubscriptionReference = (userId) => `BILL-${userId}-${Date.now()}`;

const validateBillableSelection = (plan, interval) => {
  const normalizedPlan = normalizePlan(plan);
  const normalizedInterval = normalizeInterval(interval);

  if (!PLAN_CONFIG[normalizedPlan]) {
    throw new Error("Invalid plan");
  }

  if (!["monthly", "yearly"].includes(normalizedInterval)) {
    throw new Error("Invalid billing interval");
  }

  if (normalizedPlan === "business") {
    throw new Error("Business billing is custom. Please contact sales.");
  }

  return { normalizedPlan, normalizedInterval };
};

exports.getCurrentPlan = async (req, res) => {
  try {
    const user = await User.findById(req.user._id || req.user.id).select(
      "plan billing subscription"
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    const plan = normalizePlan(user.plan || "free");
    return res.json({
      plan,
      billing: user.billing || {},
      subscription: user.subscription || {},
      features: buildBillingFeatures(plan),
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getBillingHistory = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const history = await BillingHistory.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    return res.json(history);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

exports.initializeBilling = async (req, res) => {
  try {
    const { normalizedPlan, normalizedInterval } = validateBillableSelection(
      req.body.plan,
      req.body.interval,
    );

    const user = await resolveAuthenticatedUser(req);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (
      user.plan === normalizedPlan &&
      user.subscription?.status === "active" &&
      user.billing?.billingStatus === "active"
    ) {
      return res.status(400).json({
        message: `You already have an active ${normalizedPlan} subscription.`,
      });
    }

    const amount = getPlanAmount(normalizedPlan, normalizedInterval);
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "This plan cannot be billed automatically" });
    }

    const reference = createSubscriptionReference(user._id);

    // const paystackRef = response.data.data.reference;

    const metadata = {
      type: "subscription_upgrade",
      userId: String(user._id),
      plan: normalizedPlan,
      interval: normalizedInterval,
      reference,
    };

    await upsertBillingHistory({
      userId: user._id,
      plan: normalizedPlan,
      amount,
      interval: normalizedInterval,
      status: "pending",
      reference,
      metadata,
    });

    if (!PAYSTACK_SECRET) {
      return res.status(500).json({ message: "Payment provider not configured" });
    }

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: user.email,
        amount: amount * 100,
        reference,
        callback_url: getVerifyCallbackUrl(reference),
        metadata,
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
      },
    );

    // DO NOT update user.plan or subscription status here - wait for webhook confirmation
    // Only save the pending BillingHistory

    return res.json({
      message: "Billing initialized",
      authorization_url: response.data?.data?.authorization_url,
      access_code: response.data?.data?.access_code,
      reference,
    });
  } catch (error) {
    return res.status(400).json({
      message: error.response?.data?.message || error.message || "Could not initialize billing",
    });
  }
};

exports.verifyBilling = async (req, res) => {
  try {
    const reference = String(req.params.reference || req.query.reference || "").trim();
    if (!reference) {
      return res.status(400).json({ message: "Missing payment reference" });
    }

    if (!PAYSTACK_SECRET) {
      return res.status(500).json({ message: "Payment provider not configured" });
    }

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
      },
    );

    const data = response.data?.data;
    if (!data) {
      return res.status(400).json({ message: "No transaction data found" });
    }

    const metadata = data.metadata || {};
    if (metadata.type !== "subscription_upgrade") {
      return res.status(400).json({ message: "Reference does not belong to a billing transaction" });
    }

    // Check if already processed
    const existingHistory = await BillingHistory.findOne({ reference });
    if (existingHistory && existingHistory.status === "success") {
      const user = await User.findById(metadata.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const normalizedPlan = normalizePlan(metadata.plan);
      const normalizedInterval = normalizeInterval(metadata.interval);
      const needsSync =
        user.plan !== normalizedPlan ||
        user.subscription?.status !== "active" ||
        user.billing?.billingStatus !== "active" ||
        String(user.subscription?.interval) !== normalizedInterval;

      if (needsSync) {
        await syncUserBillingState({
          user,
          plan: normalizedPlan,
          interval: normalizedInterval,
          status: "active",
          reference,
          customerCode: data.customer?.customer_code || "",
          subscriptionCode: data.subscription?.subscription_code || "",
          effectiveDate: new Date(data.paid_at || Date.now()),
        });
      }

      return res.json({
        message: "Billing already verified",
        user: sanitizeUser(user),
        billing: user.billing,
        subscription: user.subscription,
        nextBillingDate: user.subscription?.nextBillingDate,
      });
    }

    if (data.status !== "success") {
      await upsertBillingHistory({
        userId: metadata.userId,
        plan: metadata.plan,
        amount: Number(data.amount || 0) / 100,
        interval: metadata.interval,
        status: "failed",
        reference,
        paystackCustomerId: data.customer?.customer_code || "",
        metadata,
      });
      return res.status(400).json({ message: "Payment not successful" });
    }

    const user = await User.findById(metadata.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const normalizedPlan = normalizePlan(metadata.plan);
    const normalizedInterval = normalizeInterval(metadata.interval);
    const amount = getPlanAmount(normalizedPlan, normalizedInterval);

    const { user: updatedUser, nextBillingDate } = await syncUserBillingState({
      user,
      plan: normalizedPlan,
      interval: normalizedInterval,
      status: "active",
      reference,
      customerCode: data.customer?.customer_code || "",
      subscriptionCode: data.subscription?.subscription_code || "",
      effectiveDate: new Date(data.paid_at || Date.now()),
    });

    await upsertBillingHistory({
      userId: updatedUser._id,
      plan: normalizedPlan,
      amount,
      interval: normalizedInterval,
      status: "success",
      reference,
      paystackCustomerId: data.customer?.customer_code || "",
      paystackSubscriptionCode: data.subscription?.subscription_code || "",
      metadata,
    });

    return res.json({
      message: "Billing verified successfully",
      user: sanitizeUser(updatedUser),
      billing: updatedUser.billing,
      subscription: updatedUser.subscription,
      nextBillingDate,
    });
  } catch (error) {
    return res.status(400).json({
      message: error.response?.data?.message || error.message || "Billing verification failed",
    });
  }
};

exports.upgradePlan = exports.initializeBilling;

exports.handleBillingRedirect = async (req, res) => {
  try {
    const reference = String(req.params.reference || "").trim();
    if (!reference) {
      return res.redirect(`${FRONTEND_URL}/billing?status=failed`);
    }

    const verifyUrl = `${BACKEND_URL}/api/billing/verify/${encodeURIComponent(reference)}`;
    try {
      await axios.get(verifyUrl);
      return res.redirect(`${FRONTEND_URL}/billing?status=success&reference=${encodeURIComponent(reference)}`);
    } catch (err) {
      console.error("VERIFY ERROR:", err.response?.data || err.message);

      return res.redirect(`${FRONTEND_URL}/billing?status=failed&reference=${encodeURIComponent(reference)}`);
    }
  } catch {
    return res.redirect(`${FRONTEND_URL}/billing?status=failed`);
  }
};
