const FeedbackSchema = new mongoose.Schema({
    programId: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    coachId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    comments: { type: String },
    rating: { type: Number, min: 1, max: 5 },
    createdAt: { type: Date, default: Date.now },
  });
  
  module.exports = mongoose.model('Feedback', FeedbackSchema);
  