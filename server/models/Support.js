const mongoose = require("mongoose");

const supportSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      unique: true
    },
    emailId: String,          
    subject: String,
    message: String,
    html: String,
    from: String,
    fromName: String,
    status: {
      type: String,
      enum: ['open', 'in-progress', 'closed'],
      default: 'open'
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high'],
      default: 'normal'
    },
    user: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User'
    }, 
    replies: [{
      message: String,
      fromAdmin: Boolean,
      createdAt: Date
    }],
    createdAt: { type: Date, default: Date.now }
  });

module.exports = mongoose.model("Support", supportSchema);

