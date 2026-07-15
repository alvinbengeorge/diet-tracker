import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completedDates: {
      type: [String], // Array of 'YYYY-MM-DD' strings for recurring task completions
      default: [],
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    time: {
      type: String, // Target time in 'HH:MM' or simple time description format
      default: '',
    },
  },
  { timestamps: true }
);

export default mongoose.models.Task || mongoose.model('Task', TaskSchema);
