import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    title: { type: String, required: true },
    start: { type: Date, required: true },
    end:   { type: Date, required: true },
    allDay: { type: Boolean, default: false },
    description: { type: String },
    programId: { type: mongoose.Schema.Types.ObjectId, ref: 'Program' },
    sessionId: { type: String },
    status: { type: String, enum: ['planned', 'completed', 'missed', 'canceled'], default: 'planned' },
    completedAt: { type: Date },
    source: { type: String, enum: ['manual','program','google'], default: 'manual' },
    timezone: { type: String, default: 'Europe/Istanbul' },
    googleEventId: { type: String },
  },
  { timestamps: true }
);

EventSchema.index({ userId: 1, start: 1, end: 1 });

export default mongoose.model('Event', EventSchema);
