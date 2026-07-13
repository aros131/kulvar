import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
  coachId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  description: { type: String },
  status: { type: String, enum: ["Pending", "Paid", "Failed"], default: "Pending" },
  conversationId: { type: String },
  iyzicoToken: { type: String },
  iyzicoPaymentId: { type: String },
  failReason: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Payment", PaymentSchema);
