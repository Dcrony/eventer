const TRIAL_DURATION_DAYS = 14;

const PLAN_TYPES = Object.freeze({
  FREE: "free",
  TRIAL: "trial",
  PRO: "pro",
});

const PROTECTED_FEATURES = Object.freeze({
  analytics: "Advanced analytics",
  tickiai: "TickiAI",
  liveStream: "Live streaming",
  team: "Team collaboration",
  privateEvents: "Private events",
  customBranding: "Custom branding",
  priorityPayouts: "Priority payouts",
});

const normalizePlan = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "business") return PLAN_TYPES.PRO;
  if (Object.values(PLAN_TYPES).includes(normalized)) return normalized;
  return PLAN_TYPES.FREE;
};

const buildTrialEndsAt = (baseDate = new Date()) => {
  const value = new Date(baseDate);
  value.setDate(value.getDate() + TRIAL_DURATION_DAYS);
  return value;
};

const getTrialTimeRemainingMs = (user, now = new Date()) => {
  if (!user?.trialEndsAt) return 0;
  return new Date(user.trialEndsAt).getTime() - new Date(now).getTime();
};

const isTrialActive = (user, now = new Date()) =>
  normalizePlan(user?.plan) === PLAN_TYPES.TRIAL && getTrialTimeRemainingMs(user, now) > 0;

const hasProAccess = (user, now = new Date()) => {
  const plan = normalizePlan(user?.plan);
  return plan === PLAN_TYPES.PRO || isTrialActive(user, now);
};

const getEffectivePlan = (user, now = new Date()) => {
  const plan = normalizePlan(user?.plan);
  if (plan === PLAN_TYPES.PRO) return PLAN_TYPES.PRO;
  if (isTrialActive(user, now)) return PLAN_TYPES.TRIAL;
  return PLAN_TYPES.FREE;
};

const getTrialDaysRemaining = (user, now = new Date()) => {
  const remainingMs = getTrialTimeRemainingMs(user, now);
  if (remainingMs <= 0) return 0;
  return Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
};

const assignTrialToUser = (user, now = new Date()) => {
  user.plan = PLAN_TYPES.TRIAL;
  user.trialEndsAt = buildTrialEndsAt(now);
  user.subscriptionStatus = "trialing";
  return user;
};

const downgradeExpiredTrial = (user, now = new Date()) => {
  if (!user) return user;
  user.plan = PLAN_TYPES.FREE;
  user.subscriptionStatus = "expired";
  if (user.trialEndsAt && new Date(user.trialEndsAt).getTime() > new Date(now).getTime()) {
    user.trialEndsAt = now;
  }
  return user;
};

const ensureSubscriptionState = async (user, options = {}) => {
  if (!user) {
    return {
      user: null,
      changed: false,
      plan: PLAN_TYPES.FREE,
      hasProAccess: false,
      isTrialActive: false,
      trialDaysRemaining: 0,
    };
  }

  const { now = new Date(), save = true } = options;
  let changed = false;
  const normalizedPlan = normalizePlan(user.plan);

  if (user.plan !== normalizedPlan) {
    user.plan = normalizedPlan;
    changed = true;
  }

  if (normalizedPlan === PLAN_TYPES.TRIAL && !isTrialActive(user, now)) {
    downgradeExpiredTrial(user, now);
    changed = true;
  }

  const effectivePlan = getEffectivePlan(user, now);

  if (changed && save) {
    await user.save();
  }

  return {
    user,
    changed,
    plan: effectivePlan,
    hasProAccess: hasProAccess(user, now),
    isTrialActive: isTrialActive(user, now),
    trialDaysRemaining: getTrialDaysRemaining(user, now),
  };
};

module.exports = {
  PLAN_TYPES,
  PROTECTED_FEATURES,
  TRIAL_DURATION_DAYS,
  normalizePlan,
  buildTrialEndsAt,
  getTrialTimeRemainingMs,
  getTrialDaysRemaining,
  isTrialActive,
  hasProAccess,
  getEffectivePlan,
  assignTrialToUser,
  downgradeExpiredTrial,
  ensureSubscriptionState,
};
