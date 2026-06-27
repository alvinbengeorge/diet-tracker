import mongoose from 'mongoose';

const LogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['food', 'workout'],
      required: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    // Food-specific fields
    caloriesIn: {
      type: Number,
      default: 0,
    },
    protein: {
      type: Number, // in grams
      default: 0,
    },
    carbs: {
      type: Number, // in grams
      default: 0,
    },
    fat: {
      type: Number, // in grams
      default: 0,
    },
    mealType: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner', 'snack', 'none'],
      default: 'none',
    },
    image: {
      type: String, // Base64 representation of the uploaded food image
    },
    // Workout-specific fields
    caloriesOut: {
      type: Number,
      default: 0,
    },
    duration: {
      type: Number, // in minutes
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Log || mongoose.model('Log', LogSchema);
