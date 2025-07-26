import mongoose from 'mongoose';
const ClientGroupSchema = new mongoose.Schema({
    name: { type: String, required: true },
    coachId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now },
  });
  
  export default mongoose.model('ClientGroup', ClientGroupSchema);
  
