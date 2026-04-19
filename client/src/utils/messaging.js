/**
 * Whether a private-chat message was sent by the logged-in user.
 * Auth payloads use `id`; some APIs use `_id`. Avoids false positives when both are missing.
 */
export function isMessageFromMe(message, currentUser) {
  if (!currentUser || !message) return false;
  const myId = currentUser.id ?? currentUser._id;
  if (myId == null) return false;

  const senderRef =
    message.senderId ??
    (message.sender && typeof message.sender === "object" ? message.sender._id : message.sender);

  if (senderRef == null) return false;
  return String(senderRef) === String(myId);
}

/** Whether `userId` is in the socket `getOnlineUsers` id list (handles id vs _id string forms). */
export function isUserOnline(onlineUserIds, userId) {
  if (userId == null || !onlineUserIds?.length) return false;
  const target = String(userId);
  return onlineUserIds.some((id) => String(id) === target);
}
