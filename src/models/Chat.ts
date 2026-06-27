import mongoose from 'mongoose';

const ChatMessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'model'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const ChatSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // One chat session/history per user
    },
    messages: [ChatMessageSchema],
  },
  { timestamps: true }
);

export default mongoose.models.Chat || mongoose.model('Chat', ChatSchema);
