import mongoose from 'mongoose';

const MealItemSchema = new mongoose.Schema({
  description: { type: String, required: true }, // örn. "1 tabak mercimek çorbası"
  calories: { type: Number, default: 0 },
  protein:  { type: Number, default: 0 }, // gram
  carbs:    { type: Number, default: 0 }, // gram
  fat:      { type: Number, default: 0 }, // gram
  estimatedByAI: { type: Boolean, default: false },
}, { _id: false });

const NutritionLogSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date:     { type: String, required: true }, // YYYY-MM-DD
  calories: { type: Number, default: null },
  protein:  { type: Number, default: null }, // gram
  carbs:    { type: Number, default: null }, // gram
  fat:      { type: Number, default: null }, // gram
  water:    { type: Number, default: null }, // ml
  items:    { type: [MealItemSchema], default: [] }, // günün öğün dökümü
}, { timestamps: true });

NutritionLogSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.models.NutritionLog || mongoose.model('NutritionLog', NutritionLogSchema);
