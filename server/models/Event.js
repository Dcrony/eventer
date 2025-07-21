const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: String,
  description: String,
  category: String,
  date: Date,
  time: String,
  location: String,
  image: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  ticketPrice: Number,
  totalTickets: Number,
  ticketsSold: {
    type: Number,
    default: 0,
  },
  liveStream: {
    isLive: Boolean,
    streamType: String, // 'youtube', 'vimeo', 'custom'
    streamURL: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Event', eventSchema);
