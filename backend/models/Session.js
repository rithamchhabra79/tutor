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
  roadmapType: { type: String, default: 'full' }, // 🗺️ Essential for resume
  autoNotes: { type: String, default: '' },
  manualNotes: { type: String, default: '' },
  selectedBook: { type: Object, default: null }, // 📚 Full Course specific
  courseContext: {
    semester: { type: Number, default: null },
    bookTitle: { type: String, default: '' },
    chapterNumber: { type: Number, default: null },
    chapterTitle: { type: String, default: '' },
    topicName: { type: String, default: '' },
    isFullCourse: { type: Boolean, default: false }
  },
  courseMeta: {
    structure: { type: Object, default: null },
    bookIndices: { type: Object, default: {} } // { [bookTitle]: indexData }
  },
  timestamp: { type: Number, default: Date.now }
});

export const Session = mongoose.model('Session', sessionSchema);
