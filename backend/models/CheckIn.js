import mongoose from 'mongoose';

const CheckInSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  coachId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  programId: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', default: null },
  week:      { type: Number, required: true },          // program haftası (1, 2, …)
  date:      { type: Date, default: Date.now },
  weight:    { type: Number, default: null },           // kg
  energyLevel:    { type: Number, min: 1, max: 5, default: null }, // 1-5
  sleepQuality:   { type: Number, min: 1, max: 5, default: null },
  stressLevel:    { type: Number, min: 1, max: 5, default: null },
  completedWorkouts: { type: Number, default: null },   // bu hafta tamamlanan antrenman
  note:      { type: String, default: '' },
}, { timestamps: true });

export default mongoose.models.CheckIn || mongoose.model('CheckIn', CheckInSchema);
