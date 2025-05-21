import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  profileImageUrl: {
    type: String,
    default: null,
  },
  password: {
    type: String,
    required: [
      function(this: { authProvider?: string }) {
        // Only require password for email/password login
        return !this.authProvider;
      },
      'Please provide a password'
    ],
    minlength: [6, 'Password must be at least 6 characters long'],
  },
  authProvider: {
    type: String,
    enum: ['google', 'facebook', null],
    default: null,
  },
  providerUserId: {
    type: String,
    sparse: true, // Allow null/undefined values
  },
  clientId: {
    type: String,
    required: [true, 'Client ID is required'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
