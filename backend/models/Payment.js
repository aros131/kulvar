import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
  coachId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  programId: { type: mongoose.Schema.Types.ObjectId, ref: "Program", default: null },
  amount: { type: Number, required: true },
  description: { type: String },
  status: { type: String, enum: ["Pending", "Paid", "Failed"], default: "Pending" },
  // Platform sales commission, computed at creation time (currently only for
  // program purchases via buyProgram — manual coach invoices aren't cut).
  // Money still settles into the platform's own iyzico merchant account;
  // there's no automated payout to coaches yet, so these are bookkeeping
  // fields, not a real transfer.
  commissionRate: { type: Number, default: null },
  platformFeeCents: { type: Number, default: null },
  coachNetCents: { type: Number, default: null },
  conversationId: { type: String },
  iyzicoToken: { type: String },
  iyzicoPaymentId: { type: String },
  failReason: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Payment", PaymentSchema);
