const mongoose = require("mongoose");
const ClientGroupSchema = new mongoose.Schema({
    name: { type: String, required: true },
    coachId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    clientIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now },
  });
  
  module.exports = mongoose.model('ClientGroup', ClientGroupSchema);
  
