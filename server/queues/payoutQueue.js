const Queue = require("bull");
const { REDIS_URL } = process.env;
const payoutQueue = new Queue("payout-release", REDIS_URL || "redis://127.0.0.1:6379");
const concurrency = 5;

// controller methods are required at runtime inside the processor to avoid circular deps
// Processor
payoutQueue.process(concurrency, async (job) => {
  const { type, payoutId, actorId, note } = job.data;
  try {
    const { releasePayout, freezePayout, refundPayout } = require("../controllers/payoutController");

    if (type === "release") {
      await releasePayout(payoutId, actorId, note || "queued-release");
      return { success: true };
    }

    if (type === "freeze") {
      await freezePayout(payoutId, actorId, note || "queued-freeze");
      return { success: true };
    }

    if (type === "refund") {
      await refundPayout(payoutId, actorId, note || "queued-refund");
      return { success: true };
    }

    throw new Error("Unknown job type");
  } catch (error) {
    console.error("Payout job failed:", job.id, error.message || error);
    throw error;
  }
});

module.exports = payoutQueue;
