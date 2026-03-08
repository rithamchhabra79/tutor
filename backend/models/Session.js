import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topic: { type: String, required: true },
  mode: { type: String, required: true },
  language: { type: String, required: true },
  messages: { type: Array, default: [] },
  summary: { type: String, default: '' },
  timestamp: { type: Number, default: Date.now }
});

export const Session = mongoose.model('Session', sessionSchema);
