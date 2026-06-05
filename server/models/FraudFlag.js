const mongoose = require('mongoose');

const fraudFlagSchema = new mongoose.Schema({
  targetType: { type: String, enum: ['organizer','event','transaction'], required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  reason: { type: String, required: true },
  score: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  resolved: { type: Boolean, default: false },
  resolvedAt: Date,
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('FraudFlag', fraudFlagSchema);
