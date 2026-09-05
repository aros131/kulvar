import mongoose from 'mongoose';

const HabitSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name:      { type: String, required: true },
  emoji:     { type: String, default: '✅' },
  active:    { type: Boolean, default: true },
}, { timestamps: true });

const HabitLogSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  habitId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Habit', required: true },
  date:     { type: String, required: true }, // YYYY-MM-DD
  done:     { type: Boolean, default: true },
}, { timestamps: true });

HabitLogSchema.index({ userId: 1, habitId: 1, date: 1 }, { unique: true });

export const Habit = mongoose.models.Habit || mongoose.model('Habit', HabitSchema);
export const HabitLog = mongoose.models.HabitLog || mongoose.model('HabitLog', HabitLogSchema);
