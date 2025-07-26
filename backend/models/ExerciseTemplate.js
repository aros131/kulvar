import mongoose from 'mongoose';
const ExerciseTemplateSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    videoUrl: { type: String }, // Optional: Link to a demo video
    coachId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
  });
  
  export default mongoose.model('ExerciseTemplate', ExerciseTemplateSchema);
  
