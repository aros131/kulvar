import mongoose from 'mongoose';

const ProgressPhotoSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  programId: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', default: null },
  url:       { type: String, required: true },
  note:      { type: String, default: '' },
  weight:    { type: Number, default: null }, // kg
  date:      { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.models.ProgressPhoto || mongoose.model('ProgressPhoto', ProgressPhotoSchema);
