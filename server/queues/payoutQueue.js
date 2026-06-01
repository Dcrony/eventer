const Queue = require("bull");
const { REDIS_URL } = process.env;
const payoutQueue = new Queue("payout-release", REDIS_URL || "redis://127.0.0.1:6379");
const concurrency = 5;

// controller methods are required at runtime inside the processor to avoid circular deps
const ActivityLog = require("../models/ActivityLog");
const { createNotification } = require("../services/notificationService");
const sendEmail = require("../utils/email");

// Processor
payoutQueue.process(concurrency, async (job) => {
  const { type, payoutId, actorId, note } = job.data;
  try {
    const { releasePayout, freezePayout, refundPayout } = require("../controllers/payoutController");

    if (type === "release") {
      const payout = await releasePayout(payoutId, actorId, note || "queued-release");
      // log activity
      if (actorId) {
        await ActivityLog.create({ adminId: actorId, action: "PAYOUT_RELEASED", targetType: "Payout", targetId: payout._id, details: `Auto/released payout ${payout._id}` });
      }
      // notify organizer
      await createNotification(null, {
        userId: payout.organizer,
        actorId: actorId,
        type: "withdrawal_completed",
        message: `Your payout of ₦${payout.netAmount.toLocaleString()} has been released to your available balance.`,
        actionUrl: "/dashboard/payouts",
        entityId: payout._id,
        entityType: "Payout",
      });
      // send email if available
      try {
        const organizer = require("../models/User");
        const o = await organizer.findById(payout.organizer);
        if (o?.email) {
          await sendEmail({ to: o.email, subject: "Payout released", html: `Your payout of ₦${payout.netAmount.toLocaleString()} has been released.` });
        }
      } catch (e) {
        console.warn("Failed to email organizer for payout release:", e.message || e);
      }
      return { success: true };
    }

    if (type === "freeze") {
      const payout = await freezePayout(payoutId, actorId, note || "queued-freeze");
      await ActivityLog.create({ adminId: actorId, action: "PAYOUT_FROZEN", targetType: "Payout", targetId: payout._id, details: `Frozen payout ${payout._id}` });
      await createNotification(null, {
        userId: payout.organizer,
        actorId: actorId,
        type: "system",
        message: `Your payout of ₦${payout.netAmount.toLocaleString()} has been frozen for review.`,
        actionUrl: "/support",
        entityId: payout._id,
        entityType: "Payout",
      });
      return { success: true };
    }

    if (type === "refund") {
      const payout = await refundPayout(payoutId, actorId, note || "queued-refund");
      await ActivityLog.create({ adminId: actorId, action: "PAYOUT_REFUNDED", targetType: "Payout", targetId: payout._id, details: `Refunded payout ${payout._id}` });
      await createNotification(null, {
        userId: payout.organizer,
        actorId: actorId,
        type: "withdrawal_failed",
        message: `Your payout of ₦${payout.netAmount.toLocaleString()} has been refunded.`,
        actionUrl: "/support",
        entityId: payout._id,
        entityType: "Payout",
      });
      return { success: true };
    }

    throw new Error("Unknown job type");
  } catch (error) {
    console.error("Payout job failed:", job.id, error.message || error);
    throw error;
  }
});

module.exports = payoutQueue;
