import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Please provide a username'],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password by default
    },
    refreshTokens: [
      {
        token: { type: String, required: true },
        createdAt: { type: Date, default: Date.now, expires: '7d' }, // Automatically expire refresh tokens after 7 days
      },
    ],
    weight: {
      type: Number,
      default: null,
    },
    height: {
      type: Number,
      default: null,
    },
    age: {
      type: Number,
      default: null,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'none'],
      default: 'none',
    },
    activityLevel: {
      type: String,
      enum: ['sedentary', 'light', 'moderate', 'active', 'very_active', 'none'],
      default: 'none',
    },
    targetCalories: {
      type: Number,
      default: 2000,
    },
  },
  { timestamps: true }
);

// Encrypt password using bcrypt before saving
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
UserSchema.methods.matchPassword = async function (enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.models.User || mongoose.model('User', UserSchema);
