const Notification = require("../models/Notification");

const createNotification = async (app, payload) => {
  const notification = await Notification.create({
    user: payload.userId,
    actor: payload.actorId || null,
    type: payload.type || "system",
    message: payload.message,
    actionUrl: payload.actionUrl || null,
    entityId: payload.entityId || null,
    entityType: payload.entityType || null,
    meta: payload.meta || {},
  });

  const io = app?.get?.("io");
  if (io?.emitToUser) {
    io.emitToUser(payload.userId, "new_notification", notification.toJSON());
  }

  return notification;
};

module.exports = {
  createNotification,
};
