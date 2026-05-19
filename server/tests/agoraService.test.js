const { describe, it } = require("node:test");
const assert = require("node:assert");
const {
  buildChannelName,
  uidFromUserId,
  getAgoraConfig,
} = require("../services/agoraService");

describe("agoraService", () => {
  it("buildChannelName prefixes event id", () => {
    assert.strictEqual(buildChannelName("abc123"), "event_abc123");
  });

  it("uidFromUserId returns stable positive integer", () => {
    const uid = uidFromUserId("507f1f77bcf86cd799439011");
    assert.ok(uid >= 1);
    assert.strictEqual(uidFromUserId("507f1f77bcf86cd799439011"), uid);
  });

  it("getAgoraConfig reflects env", () => {
    const prevId = process.env.AGORA_APP_ID;
    const prevCert = process.env.AGORA_APP_CERTIFICATE;
    process.env.AGORA_APP_ID = "test-app";
    process.env.AGORA_APP_CERTIFICATE = "test-cert";
    assert.strictEqual(getAgoraConfig().isConfigured, true);
    process.env.AGORA_APP_ID = prevId;
    process.env.AGORA_APP_CERTIFICATE = prevCert;
  });
});
