import mongoose from 'mongoose';

const ExerciseSchema = new mongoose.Schema({
  externalId: String,
  name: { type: String, required: true },
  nameTR: String,
  bodyPart: String,
  bodyPartTR: String,
  target: String,
  targetTR: String,
  equipment: String,
  equipmentTR: String,
  level: String,
  gifUrl: String,
  secondaryMuscles: [String],
  instructions: [String],
});

ExerciseSchema.index({ name: 'text', nameTR: 'text' });
ExerciseSchema.index({ bodyPart: 1 });
ExerciseSchema.index({ equipment: 1 });

export default mongoose.model('Exercise', ExerciseSchema);
