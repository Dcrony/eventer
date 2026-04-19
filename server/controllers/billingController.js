const User = require("../models/User");

const PLAN_PRICING = {
  free: { monthly: 0, yearly: 0 },
  pro: { monthly: 4999, yearly: 49990 },
  business: { monthly: 14999, yearly: 149990 },
};

exports.getCurrentPlan = async (req, res) => {
  try {
    const user = await User.findById(req.user._id || req.user.id).select("plan subscriptionHistory");
    if (!user) return res.status(404).json({ message: "User not found" });

    const plan = String(user.plan || "free").toLowerCase();
    return res.json({
      plan,
      features: {
        events: plan === "free" ? "limited" : "unlimited",
        analytics: plan === "free" ? "disabled" : "enabled",
        featuredPlacement: plan === "business",
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getBillingHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user._id || req.user.id).select("subscriptionHistory");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json(user.subscriptionHistory || []);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

exports.upgradePlan = async (req, res) => {
  try {
    const nextPlan = String(req.body.plan || "").toLowerCase();
    const interval = String(req.body.interval || "monthly").toLowerCase();
    if (!PLAN_PRICING[nextPlan]) {
      return res.status(400).json({ message: "Invalid plan" });
    }
    if (!["monthly", "yearly"].includes(interval)) {
      return res.status(400).json({ message: "Invalid billing interval" });
    }

    const user = await User.findById(req.user._id || req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.plan = nextPlan;
    user.subscriptionHistory = user.subscriptionHistory || [];
    user.subscriptionHistory.unshift({
      plan: nextPlan,
      amount: PLAN_PRICING[nextPlan][interval],
      interval,
      changedAt: new Date(),
    });
    await user.save();

    return res.json({
      message: "Subscription updated",
      plan: user.plan,
      subscriptionHistory: user.subscriptionHistory,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};
