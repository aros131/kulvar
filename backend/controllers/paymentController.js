import Payment from '../models/Payment.js';
import { createCheckoutForm, retrieveCheckoutForm } from '../services/iyzicoService.js';

const APP_URL = (process.env.APP_URL || 'http://localhost:3000').replace(/\/+$/, '');
const API_PUBLIC_URL = (process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 5001}`).replace(/\/+$/, '');

export const createInvoice = async (req, res) => {
  try {
    const { userId, amount, description } = req.body;
    const invoice = await Payment.create({
      coachId: req.user._id,
      userId,
      amount,
      description,
      status: "Pending",
    });
    res.status(201).json({ message: "Invoice created successfully", data: invoice });
  } catch (error) {
    res.status(500).json({ message: "Error creating invoice", error: error.message });
  }
};

export const getInvoices = async (req, res) => {
  try {
    const invoices = await Payment.find({ coachId: req.user._id }).populate('userId', 'name email');
    res.status(200).json({ invoices });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving invoices", error: error.message });
  }
};

export const getMyInvoices = async (req, res) => {
  try {
    const invoices = await Payment.find({ userId: req.user._id }).populate('coachId', 'name');
    res.status(200).json({ invoices });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving invoices", error: error.message });
  }
};

export const processPayment = async (req, res) => {
  try {
    const { invoiceId } = req.body;
    const payment = await Payment.findByIdAndUpdate(invoiceId, { status: "Paid" }, { new: true });
    res.status(200).json({ message: "Payment processed successfully", data: payment });
  } catch (error) {
    res.status(500).json({ message: "Error processing payment", error: error.message });
  }
};

export const initializeIyzicoPayment = async (req, res) => {
  try {
    const { invoiceId } = req.body;
    const payment = await Payment.findOne({ _id: invoiceId, userId: req.user._id });
    if (!payment) return res.status(404).json({ message: "Invoice not found" });
    if (payment.status === "Paid") return res.status(400).json({ message: "Invoice already paid" });

    const callbackUrl = `${API_PUBLIC_URL}/payment/iyzico/callback`;
    const result = await createCheckoutForm({
      payment,
      buyerUser: req.user,
      ip: req.ip,
      callbackUrl,
    });

    payment.conversationId = result.conversationId;
    payment.iyzicoToken = result.token;
    await payment.save();

    res.status(200).json({ checkoutFormContent: result.checkoutFormContent, token: result.token });
  } catch (error) {
    res.status(500).json({ message: "Ödeme başlatılamadı", error: error.message });
  }
};

export const iyzicoCallback = async (req, res) => {
  const token = req.body?.token || req.query?.token;
  try {
    if (!token) throw new Error("Missing token");

    const result = await retrieveCheckoutForm({ token });
    const payment = await Payment.findOne({ iyzicoToken: token });
    if (!payment) throw new Error("Invoice not found for token");

    if (result.status === "success" && result.paymentStatus === "SUCCESS") {
      payment.status = "Paid";
      payment.iyzicoPaymentId = result.paymentId;
    } else {
      payment.status = "Failed";
      payment.failReason = result.errorMessage || result.fraudStatus || "Payment failed";
    }
    await payment.save();

    res.redirect(`${APP_URL}/dashboard/user/payments?status=${payment.status === "Paid" ? "success" : "failed"}`);
  } catch (error) {
    res.redirect(`${APP_URL}/dashboard/user/payments?status=failed&reason=${encodeURIComponent(error.message)}`);
  }
};
