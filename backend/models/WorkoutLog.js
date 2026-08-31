import mongoose from 'mongoose';

const SetSchema = new mongoose.Schema({
  setNumber: Number,
  reps:      { type: Number, default: null },
  weight:    { type: Number, default: null },
  completed: { type: Boolean, default: true },
}, { _id: false });

const LoggedExerciseSchema = new mongoose.Schema({
  name:         String,
  plannedSets:  Number,
  plannedReps:  { type: Number, default: null },
  plannedWeight:{ type: Number, default: null },
  sets:         [SetSchema],
}, { _id: false });

const WorkoutLogSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true, index: true },
  eventId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Event',   required: true },
  programId: { type: mongoose.Schema.Types.ObjectId, ref: 'Program' },
  date:      { type: Date, default: Date.now },
  exercises: [LoggedExerciseSchema],
}, { timestamps: true });

WorkoutLogSchema.index({ userId: 1, eventId: 1 }, { unique: true });

export default mongoose.models.WorkoutLog || mongoose.model('WorkoutLog', WorkoutLogSchema);
