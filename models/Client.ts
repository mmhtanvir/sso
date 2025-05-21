import mongoose from 'mongoose';

const ClientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name for the client'],
    trim: true,
  },
  allowedOrigins: {
    type: [String],
    required: [true, 'Please provide allowed origins'],
  },
  redirectUrls: {
    type: [String],
    required: [true, 'Please provide redirect URLs'],
  },
  logoUrl: {
    type: String,
    default: '',
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
  // Google OAuth credentials
  googleClientId: {
    type: String,
    default: '',
  },
  googleClientSecret: {
    type: String,
    default: '',
  },
  // Facebook OAuth credentials
  facebookAppId: {
    type: String,
    default: '',
  },
  facebookAppSecret: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Client || mongoose.model('Client', ClientSchema);
