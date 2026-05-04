const supportTicketSchema = new Schema({
  ticketId: { type: String, unique: true },
  emailId: String,           // from Resend
  subject: String,
  message: String,
  html: String,
  from: String,
  fromName: String,
  status: { type: String, enum: ['open', 'in-progress', 'closed'], default: 'open' },
  priority: { type: String, enum: ['low', 'normal', 'high'], default: 'normal' },
  user: { type: Schema.Types.ObjectId, ref: 'User' }, // if the sender is a registered user
  replies: [{
    message: String,
    fromAdmin: Boolean,
    createdAt: Date
  }],
  createdAt: { type: Date, default: Date.now }
});