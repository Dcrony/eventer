const bcrypt = require("bcryptjs");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const User = require("../models/User.js");

const ACCOUNT_FIELDS = ["name", "username", "email", "phone", "bio"];
const PRIVACY_FIELDS = ["showProfile", "showActivity", "searchable"];
const NOTIFICATION_FIELDS = [
  "likes",
  "comments",
  "follows",
  "eventReminders",
  "emailAlerts",
  "appPush",
  "smsAlerts",
];
const INTEGRATION_KEYS = ["stripe", "googleCalendar", "zoom"];
const BILLING_PLAN_OPTIONS = ["free", "pro", "business"];
const JWT_SECRET = process.env.JWT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080";
const GOOGLE_REDIRECT_URI =
  process.env.GOOGLE_OAUTH_REDIRECT_URI ||
  `${BACKEND_URL}/api/settings/integrations/googleCalendar/callback`;
const ZOOM_REDIRECT_URI =
  process.env.ZOOM_OAUTH_REDIRECT_URI ||
  `${BACKEND_URL}/api/settings/integrations/zoom/callback`;

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

const getBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
};

const ensureBooleanMap = (source, fields, label) => {
  const updates = {};
  for (const field of fields) {
    if (source[field] === undefined) continue;
    const parsed = getBoolean(source[field]);
    if (parsed === null) {
      throw new Error(`${label} "${field}" must be a boolean.`);
    }
    updates[field] = parsed;
  }
  return updates;
};

const normalizeString = (value) => String(value || "").trim();
const createOauthState = (userId, integrationKey) =>
  jwt.sign(
    {
      userId: String(userId),
      integrationKey,
      type: "integration_oauth",
    },
    JWT_SECRET,
    { expiresIn: "10m" }
  );

const parseOauthState = (state, integrationKey) => {
  if (!state || !JWT_SECRET) {
    throw new Error("Invalid OAuth state");
  }

  const decoded = jwt.verify(state, JWT_SECRET);
  if (decoded.type !== "integration_oauth" || decoded.integrationKey !== integrationKey) {
    throw new Error("Invalid OAuth state");
  }

  return decoded;
};

const buildIntegrationCloseWindowResponse = (res, message, succeeded = true) => {
  const safeMessage = JSON.stringify(message);
  const safeStatus = JSON.stringify(succeeded ? "success" : "error");
  return res.send(`<!doctype html>
<html>
  <body style="font-family:Arial,sans-serif;padding:24px;">
    <h2>${succeeded ? "Integration connected" : "Integration failed"}</h2>
    <p>${message}</p>
    <script>
      if (window.opener) {
        window.opener.postMessage({ source: "tickispot-integration", status: ${safeStatus}, message: ${safeMessage} }, "*");
      }
      setTimeout(() => window.close(), 1200);
    </script>
  </body>
</html>`);
};

const disconnectIntegrationFields = (integrationKey) => {
  if (integrationKey === "googleCalendar") {
    return {
      connected: false,
      label: "Not connected",
      accessToken: "",
      refreshToken: "",
      scope: "",
      expiryDate: null,
      calendarEmail: "",
      connectedAt: null,
    };
  }

  if (integrationKey === "zoom") {
    return {
      connected: false,
      label: "Not connected",
      accessToken: "",
      refreshToken: "",
      scope: "",
      expiryDate: null,
      accountId: "",
      accountEmail: "",
      connectedAt: null,
    };
  }

  return {
    connected: false,
    label: "Not connected",
    accountId: "",
    accountEmail: "",
    connectedAt: null,
  };
};

const requirePasswordVerification = async (user, currentPassword, message = "Current password is required") => {
  if (!user.password) {
    return;
  }

  if (!currentPassword) {
    throw new Error(message);
  }

  const matches = await bcrypt.compare(currentPassword, user.password);
  if (!matches) {
    throw new Error("Current password is incorrect");
  }
};

const getSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ user: sanitizeUser(user) });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

const updateAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const updates = {};
    for (const field of ACCOUNT_FIELDS) {
      if (req.body[field] === undefined) continue;
      updates[field] = typeof req.body[field] === "string" ? req.body[field].trim() : req.body[field];
    }

    if (updates.name !== undefined && updates.name.length < 2) {
      return res.status(400).json({ message: "Name must be at least 2 characters long" });
    }

    if (updates.username !== undefined) {
      updates.username = normalizeString(updates.username);
      if (!/^[a-zA-Z0-9_-]{3,24}$/.test(updates.username)) {
        return res.status(400).json({
          message: "Username must be 3-24 characters and use only letters, numbers, underscores, or hyphens",
        });
      }

      const existingUsername = await User.findOne({
        username: updates.username,
        _id: { $ne: user._id },
      });
      if (existingUsername) {
        return res.status(400).json({ message: "Username already in use" });
      }
    }

    if (updates.email !== undefined) {
      updates.email = normalizeString(updates.email).toLowerCase();
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(updates.email)) {
        return res.status(400).json({ message: "Please provide a valid email address" });
      }

      await requirePasswordVerification(
        user,
        req.body.currentPassword,
        "Current password is required to change your email address",
      );

      const existingEmail = await User.findOne({
        email: updates.email,
        _id: { $ne: user._id },
      });
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    if (updates.phone !== undefined) {
      updates.phone = normalizeString(updates.phone);
      if (updates.phone && !/^[0-9+\-()\s]{7,20}$/.test(updates.phone)) {
        return res.status(400).json({ message: "Please provide a valid phone number" });
      }
    }

    if (updates.bio !== undefined && String(updates.bio).length > 280) {
      return res.status(400).json({ message: "Bio must be 280 characters or fewer" });
    }

    Object.assign(user, updates);
    await user.save();

    return res.json({ message: "Account settings updated", user: sanitizeUser(user) });
  } catch (err) {
    const status = err.name === "ValidationError" || err.code === 11000 ? 400 : 500;
    return res.status(status).json({ message: err.message || "Error updating account settings" });
  }
};

const updatePrivacy = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const updates = ensureBooleanMap(req.body, PRIVACY_FIELDS, "Privacy field");
    user.privacy = {
      ...user.privacy?.toObject?.(),
      ...updates,
    };

    await user.save();
    return res.json({ message: "Privacy updated successfully", user: sanitizeUser(user) });
  } catch (err) {
    return res.status(400).json({ message: err.message || "Error updating privacy settings" });
  }
};

const updateNotifications = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const updates = ensureBooleanMap(req.body, NOTIFICATION_FIELDS, "Notification field");
    user.notifications = {
      ...user.notifications?.toObject?.(),
      ...updates,
    };

    await user.save();
    return res.json({ message: "Notifications updated successfully", user: sanitizeUser(user) });
  } catch (err) {
    return res.status(400).json({ message: err.message || "Error updating notifications" });
  }
};

const updateSecurity = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { currentPassword, newPassword } = req.body;
    const securityUpdates = {};

    if (req.body.twoFactorEnabled !== undefined) {
      const parsed = getBoolean(req.body.twoFactorEnabled);
      if (parsed === null) {
        return res.status(400).json({ message: "Two-factor setting must be a boolean" });
      }
      securityUpdates.twoFactorEnabled = parsed;
    }

    const changingSecuritySetting =
      Object.prototype.hasOwnProperty.call(securityUpdates, "twoFactorEnabled") ||
      Boolean(newPassword);

    if (!changingSecuritySetting) {
      return res.status(400).json({ message: "No security changes were provided" });
    }

    if (changingSecuritySetting) {
      await requirePasswordVerification(user, currentPassword);
    }

    if (newPassword) {
      if (String(newPassword).length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters long" });
      }

      const matchesCurrentPassword = user.password
        ? await bcrypt.compare(newPassword, user.password)
        : false;
      if (matchesCurrentPassword) {
        return res.status(400).json({ message: "New password must be different from your current password" });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      securityUpdates.lastPasswordChange = new Date();
    }

    user.security = {
      ...user.security?.toObject?.(),
      ...securityUpdates,
    };

    await user.save();
    return res.json({ message: "Security settings updated", user: sanitizeUser(user) });
  } catch (err) {
    return res.status(400).json({ message: err.message || "Error updating security settings" });
  }
};

const updateEventPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const updates = {};
    if (req.body.defaultTicketPrice !== undefined) {
      const parsed = Number(req.body.defaultTicketPrice);
      if (!Number.isFinite(parsed) || parsed < 0) {
        return res.status(400).json({ message: "Default ticket price must be a non-negative number" });
      }
      updates.defaultTicketPrice = parsed;
    }

    if (req.body.eventVisibility !== undefined) {
      const visibility = normalizeString(req.body.eventVisibility).toLowerCase();
      if (!["public", "private"].includes(visibility)) {
        return res.status(400).json({ message: "Event visibility must be either public or private" });
      }
      updates.eventVisibility = visibility;
    }

    if (req.body.autoPublishEvents !== undefined) {
      const parsed = getBoolean(req.body.autoPublishEvents);
      if (parsed === null) {
        return res.status(400).json({ message: "Auto publish events must be a boolean" });
      }
      updates.autoPublishEvents = parsed;
    }

    user.eventPreferences = {
      ...user.eventPreferences?.toObject?.(),
      ...updates,
    };

    await user.save();
    return res.json({ message: "Event preferences updated", user: sanitizeUser(user) });
  } catch (err) {
    return res.status(400).json({ message: err.message || "Error updating event preferences" });
  }
};

const updateBillingPlan = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const requestedPlan = normalizeString(req.body.plan).toLowerCase();
    const cycle = ["monthly", "yearly"].includes(normalizeString(req.body.cycle).toLowerCase())
      ? normalizeString(req.body.cycle).toLowerCase()
      : "monthly";
    if (!BILLING_PLAN_OPTIONS.includes(requestedPlan)) {
      return res.status(400).json({ message: "Invalid billing plan" });
    }

    user.plan = requestedPlan;
    user.billing = {
      ...user.billing?.toObject?.(),
      plan: requestedPlan === "free" ? "Free" : requestedPlan[0].toUpperCase() + requestedPlan.slice(1),
      cycle,
      nextBillingDate: requestedPlan === "free" ? null : user.billing?.nextBillingDate || null,
      billingStatus: requestedPlan === "free" ? "inactive" : user.billing?.billingStatus || "active",
    };

    await user.save();
    return res.json({ message: "Billing plan updated", user: sanitizeUser(user) });
  } catch (err) {
    return res.status(400).json({ message: err.message || "Error updating billing settings" });
  }
};

const getIntegrations = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("integrations");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ integrations: user.integrations || {} });
  } catch (err) {
    return res.status(500).json({ message: "Error loading integrations" });
  }
};

const updateIntegration = async (req, res) => {
  try {
    const integrationKey = normalizeString(req.params.key);
    if (!INTEGRATION_KEYS.includes(integrationKey)) {
      return res.status(404).json({ message: "Integration not found" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const connected = getBoolean(req.body.connected);
    if (connected === null) {
      return res.status(400).json({ message: "Integration connected value must be a boolean" });
    }

    if (connected && ["googleCalendar", "zoom"].includes(integrationKey)) {
      return res.status(400).json({
        message: `Use the OAuth connect flow for ${integrationKey === "googleCalendar" ? "Google Calendar" : "Zoom"}`,
      });
    }

    user.integrations = {
      ...user.integrations?.toObject?.(),
      [integrationKey]: connected
        ? {
            ...user.integrations?.toObject?.()?.[integrationKey],
            connected: true,
            label: "Connected",
            connectedAt: new Date(),
          }
        : disconnectIntegrationFields(integrationKey),
    };

    await user.save();
    return res.json({ message: `${integrationKey} integration updated`, user: sanitizeUser(user) });
  } catch (err) {
    return res.status(400).json({ message: err.message || "Error updating integration" });
  }
};

const getIntegrationAuthUrl = async (req, res) => {
  try {
    const integrationKey = normalizeString(req.params.key);
    if (!["googleCalendar", "zoom"].includes(integrationKey)) {
      return res.status(404).json({ message: "OAuth integration not found" });
    }

    const state = createOauthState(req.user.id, integrationKey);
    let authUrl = "";

    if (integrationKey === "googleCalendar") {
      if (!process.env.GOOGLE_CLIENT_ID) {
        return res.status(400).json({ message: "Google OAuth is not configured" });
      }

      const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        redirect_uri: GOOGLE_REDIRECT_URI,
        response_type: "code",
        access_type: "offline",
        prompt: "consent",
        scope: "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.email",
        state,
      });
      authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    } else {
      if (!process.env.ZOOM_CLIENT_ID) {
        return res.status(400).json({ message: "Zoom OAuth is not configured" });
      }

      const params = new URLSearchParams({
        response_type: "code",
        client_id: process.env.ZOOM_CLIENT_ID,
        redirect_uri: ZOOM_REDIRECT_URI,
        state,
      });
      authUrl = `https://zoom.us/oauth/authorize?${params.toString()}`;
    }

    return res.json({ authUrl });
  } catch (err) {
    return res.status(400).json({ message: err.message || "Could not start OAuth flow" });
  }
};

const handleGoogleCalendarCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code || !state) {
      return buildIntegrationCloseWindowResponse(res, "Missing Google authorization code.", false);
    }

    const decoded = parseOauthState(state, "googleCalendar");
    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      new URLSearchParams({
        code: String(code),
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      }).toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const profileResponse = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` },
    });

    const user = await User.findById(decoded.userId);
    if (!user) {
      return buildIntegrationCloseWindowResponse(res, "User not found.", false);
    }

    user.integrations = {
      ...user.integrations?.toObject?.(),
      googleCalendar: {
        connected: true,
        label: "Connected",
        accessToken: tokenResponse.data.access_token || "",
        refreshToken: tokenResponse.data.refresh_token || user.integrations?.googleCalendar?.refreshToken || "",
        scope: tokenResponse.data.scope || "",
        expiryDate: tokenResponse.data.expires_in
          ? new Date(Date.now() + Number(tokenResponse.data.expires_in) * 1000)
          : null,
        calendarEmail: profileResponse.data.email || "",
        connectedAt: new Date(),
      },
    };

    await user.save();
    return buildIntegrationCloseWindowResponse(res, "Google Calendar connected successfully.");
  } catch (err) {
    return buildIntegrationCloseWindowResponse(
      res,
      err.response?.data?.error_description || err.message || "Google Calendar connection failed.",
      false
    );
  }
};

const handleZoomCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code || !state) {
      return buildIntegrationCloseWindowResponse(res, "Missing Zoom authorization code.", false);
    }

    const decoded = parseOauthState(state, "zoom");
    const credentials = Buffer.from(
      `${process.env.ZOOM_CLIENT_ID || ""}:${process.env.ZOOM_CLIENT_SECRET || ""}`
    ).toString("base64");

    const tokenResponse = await axios.post(
      "https://zoom.us/oauth/token",
      new URLSearchParams({
        grant_type: "authorization_code",
        code: String(code),
        redirect_uri: ZOOM_REDIRECT_URI,
      }).toString(),
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const profileResponse = await axios.get("https://api.zoom.us/v2/users/me", {
      headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` },
    });

    const user = await User.findById(decoded.userId);
    if (!user) {
      return buildIntegrationCloseWindowResponse(res, "User not found.", false);
    }

    user.integrations = {
      ...user.integrations?.toObject?.(),
      zoom: {
        connected: true,
        label: "Connected",
        accessToken: tokenResponse.data.access_token || "",
        refreshToken: tokenResponse.data.refresh_token || user.integrations?.zoom?.refreshToken || "",
        scope: tokenResponse.data.scope || "",
        expiryDate: tokenResponse.data.expires_in
          ? new Date(Date.now() + Number(tokenResponse.data.expires_in) * 1000)
          : null,
        accountId: profileResponse.data.account_id || "",
        accountEmail: profileResponse.data.email || "",
        connectedAt: new Date(),
      },
    };

    await user.save();
    return buildIntegrationCloseWindowResponse(res, "Zoom connected successfully.");
  } catch (err) {
    return buildIntegrationCloseWindowResponse(
      res,
      err.response?.data?.reason || err.message || "Zoom connection failed.",
      false
    );
  }
};

const exportSettingsData = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const exportedAt = new Date().toISOString();
    const payload = {
      exportedAt,
      user: sanitizeUser(user),
      settings: {
        account: {
          name: user.name || "",
          username: user.username || "",
          email: user.email || "",
          phone: user.phone || "",
          bio: user.bio || "",
        },
        privacy: user.privacy || {},
        notifications: user.notifications || {},
        security: {
          twoFactorEnabled: Boolean(user.security?.twoFactorEnabled),
          lastPasswordChange: user.security?.lastPasswordChange || null,
        },
        eventPreferences: user.eventPreferences || {},
        billing: user.billing || {},
        integrations: user.integrations || {},
      },
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=\"tickispot-settings-${req.user.id}-${Date.now()}.json\"`
    );
    return res.status(200).send(JSON.stringify(payload, null, 2));
  } catch (err) {
    return res.status(500).json({ message: "Error exporting account data" });
  }
};

const logoutAllSessions = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await requirePasswordVerification(
      user,
      req.body.currentPassword,
      "Current password is required to log out all devices",
    );

    user.security = {
      ...user.security?.toObject?.(),
      sessionVersion: Number(user.security?.sessionVersion || 0) + 1,
    };

    await user.save();
    return res.json({
      message: "All devices have been logged out",
      user: sanitizeUser(user),
      shouldLogout: true,
    });
  } catch (err) {
    return res.status(400).json({ message: err.message || "Error logging out all devices" });
  }
};

const deactivateAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await requirePasswordVerification(
      user,
      req.body.currentPassword,
      "Current password is required to deactivate your account",
    );

    user.isDeleted = true;
    user.deletedAt = new Date();
    user.security = {
      ...user.security?.toObject?.(),
      sessionVersion: Number(user.security?.sessionVersion || 0) + 1,
    };

    await user.save();
    return res.json({
      message: "Account deactivated",
      user: sanitizeUser(user),
      shouldLogout: true,
    });
  } catch (err) {
    return res.status(400).json({ message: err.message || "Error deactivating account" });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await requirePasswordVerification(
      user,
      req.body.currentPassword,
      "Current password is required to delete your account",
    );

    await user.deleteOne();
    return res.json({ message: "Account deleted successfully", shouldLogout: true });
  } catch (err) {
    return res.status(400).json({ message: err.message || "Error deleting account" });
  }
};

module.exports = {
  getSettings,
  updateAccount,
  updatePrivacy,
  updateNotifications,
  updateSecurity,
  updateEventPreferences,
  updateBillingPlan,
  getIntegrations,
  updateIntegration,
  getIntegrationAuthUrl,
  handleGoogleCalendarCallback,
  handleZoomCallback,
  exportSettingsData,
  logoutAllSessions,
  deactivateAccount,
  deleteAccount,
};
