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
    assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProgramAssignment' },
externalKey:  { type: String, index: true }, // e.g. `${assignmentId}:${dayIdx}:${sessionIdx}`
  },
  { timestamps: true }
);

EventSchema.index(
  { userId: 1, programId: 1, assignmentId: 1, externalKey: 1 },
  { unique: true, partialFilterExpression: { externalKey: { $type: 'string' } } }
);

export default mongoose.model('Event', EventSchema);
