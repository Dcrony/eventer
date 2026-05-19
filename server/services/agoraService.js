const { RtcTokenBuilder, RtcRole } = require("agora-token");

const DEFAULT_TOKEN_TTL_SECONDS = 60 * 60;

const getAgoraConfig = () => {
  const appId = String(process.env.AGORA_APP_ID || "").trim();
  const appCertificate = String(process.env.AGORA_APP_CERTIFICATE || "").trim();
  return { appId, appCertificate, isConfigured: Boolean(appId && appCertificate) };
};

const buildChannelName = (eventId) => `event_${String(eventId)}`;

const uidFromUserId = (userId) => {
  const raw = String(userId || "");
  const parsed = parseInt(raw.slice(-8), 16);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 1;
  }
  return parsed % 2147483647 || 1;
};

const buildRtcToken = ({
  channelName,
  uid,
  role = "subscriber",
  expireSeconds = DEFAULT_TOKEN_TTL_SECONDS,
}) => {
  const { appId, appCertificate, isConfigured } = getAgoraConfig();
  if (!isConfigured) {
    throw new Error("AGORA_NOT_CONFIGURED");
  }

  const rtcRole = role === "publisher" ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
  const token = RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channelName,
    uid,
    rtcRole,
    expireSeconds,
    expireSeconds,
  );

  return { appId, token, channel: channelName, uid, role };
};

module.exports = {
  DEFAULT_TOKEN_TTL_SECONDS,
  getAgoraConfig,
  buildChannelName,
  uidFromUserId,
  buildRtcToken,
};
