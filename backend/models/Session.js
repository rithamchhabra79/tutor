import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topic: { type: String, required: true },
  mode: { type: String, required: true },
  language: { type: String, required: true },
  messages: { type: Array, default: [] },
  summary: { type: String, default: '' },
  progress: {
    step: { type: Number, default: 0 },
    total_steps: { type: Number, default: 0 },
    current_concept: { type: String, default: '' }
  },
  xp: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  roadmapData: { type: Object, default: null },
  autoNotes: { type: String, default: '' },
  manualNotes: { type: String, default: '' },
  timestamp: { type: Number, default: Date.now }
});

export const Session = mongoose.model('Session', sessionSchema);
