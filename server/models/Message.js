const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // For EVENT LIVE CHAT
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  username: {
    type: String,
    trim: true,
  },
  message: {
    type: String,
    trim: true,
  },

  // For PRIVATE CHAT
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    index: true,
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    index: true,
  },
  text: {
    type: String,
    trim: true,
  },

  // Common fields
  seen: {
    type: Boolean,
    default: false,
  },
  
  // Message type to distinguish between chat types
  messageType: {
    type: String,
    enum: ['event', 'private'],
    required: true,
    default: 'private',
  },
}, { 
  timestamps: true 
});

// Compound indexes for better query performance
messageSchema.index({ eventId: 1, createdAt: -1 });
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ userId: 1, eventId: 1 });

// Validate based on message type
messageSchema.pre('save', function(next) {
  if (this.messageType === 'private') {
    if (!this.sender || !this.receiver || !this.text) {
      next(new Error('Private messages require sender, receiver, and text'));
    }
    // Clear event fields if present
    this.eventId = undefined;
    this.userId = undefined;
    this.username = undefined;
    this.message = undefined;
  } else if (this.messageType === 'event') {
    if (!this.eventId || !this.userId || !this.message) {
      next(new Error('Event messages require eventId, userId, and message'));
    }
    // Clear private chat fields if present
    this.sender = undefined;
    this.receiver = undefined;
    this.text = undefined;
  }
  next();
});

module.exports = mongoose.model('Message', messageSchema);