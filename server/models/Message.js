const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  username: String,
  message: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
  
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  text: String,
});

module.exports = mongoose.model('Message', messageSchema);
