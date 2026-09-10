import Payment from '../models/Payment.js';
import Program from '../models/Program.js';
import ProgramAssignment from '../models/ProgramAssignment.js';
import { createCheckoutForm, retrieveCheckoutForm } from '../services/iyzicoService.js';
import { notify } from '../utils/notify.js';
import { generateEventsForAssignment } from './programController.js';

const APP_URL = (process.env.APP_URL || 'http://localhost:3000').replace(/\/+$/, '');
const API_PUBLIC_URL = (process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 5001}`).replace(/\/+$/, '');
const PLATFORM_COMMISSION_RATE = Number(process.env.PLATFORM_COMMISSION_RATE ?? 0.15);

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

    // Kullanıcıya: yeni ödeme talebi
    await notify({
      recipientId: userId,
      senderId: req.user._id,
      type: 'payment_request',
      message: `Koçundan ₺${amount} tutarında yeni bir ödeme talebi geldi: "${description}"`,
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

    if (payment) {
      // Kullanıcıya: ödeme onaylandı
      await notify({
        recipientId: payment.userId,
        senderId: payment.coachId,
        type: 'payment_received',
        message: `₺${payment.amount} tutarındaki ödemeniz onaylandı: "${payment.description}"`,
      });
      // Koça: ödeme alındı
      await notify({
        recipientId: payment.coachId,
        senderId: payment.userId,
        type: 'payment_received',
        message: `Danışanının ₺${payment.amount} tutarındaki ödemesi onaylandı: "${payment.description}"`,
      });
    }

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
      await payment.save();

      // Kullanıcıya: ödeme tamamlandı
      await notify({
        recipientId: payment.userId,
        senderId: payment.coachId,
        type: 'payment_received',
        message: `₺${payment.amount} tutarındaki ödemeniz başarıyla tamamlandı: "${payment.description}"`,
      });
      // Koça: ödeme alındı
      await notify({
        recipientId: payment.coachId,
        senderId: payment.userId,
        type: 'payment_received',
        message: `Danışanından ₺${payment.amount} tutarında ödeme alındı: "${payment.description}"`,
      });

      // Auto-assign program to user after successful payment
      if (payment.programId) {
        const program = await Program.findByIdAndUpdate(
          payment.programId,
          { $addToSet: { assignedClients: payment.userId } },
          { new: true }
        );
        // Idempotent: callback can fire more than once (webhook retry + redirect),
        // so reuse an existing assignment instead of creating a duplicate.
        let assignment = await ProgramAssignment.findOne({
          userId: payment.userId,
          programId: payment.programId,
        });
        if (!assignment) {
          assignment = await ProgramAssignment.create({
            userId: payment.userId,
            programId: payment.programId,
            startDate: new Date(),
            status: "active",
          });
        } else if (assignment.status !== "active") {
          assignment.status = "active";
          await assignment.save();
        }
        // A paid purchase should behave like clicking "başlat" — otherwise the
        // client owns the program but their calendar stays empty until they
        // separately start it, which they'd have no reason to know to do.
        if (program) {
          await generateEventsForAssignment(payment.userId, payment.programId, assignment, program);
        }
      }
    } else {
      payment.status = "Failed";
      payment.failReason = result.errorMessage || result.fraudStatus || "Payment failed";
      await payment.save();
    }

    const programId = payment.programId?.toString() ?? "";
    res.redirect(
      `${APP_URL}/dashboard/user/payments?status=${payment.status === "Paid" ? "success" : "failed"}&programId=${programId}`
    );
  } catch (error) {
    res.redirect(`${APP_URL}/dashboard/user/payments?status=failed&reason=${encodeURIComponent(error.message)}`);
  }
};

/** POST /payment/program/:programId/buy — user directly purchases a program */
export const buyProgram = async (req, res) => {
  try {
    const { programId } = req.params;
    const program = await Program.findById(programId).lean();
    if (!program) return res.status(404).json({ message: "Program bulunamadı" });

    const priceCents = program.priceCents;
    if (!priceCents || priceCents <= 0) {
      return res.status(400).json({ message: "Bu program ücretli değil" });
    }

    // Check if user already owns it
    const alreadyAssigned = program.assignedClients?.some(
      (id) => id.toString() === req.user._id.toString()
    );
    if (alreadyAssigned) {
      return res.status(409).json({ message: "Bu programa zaten erişiminiz var" });
    }

    const amountTL = priceCents / 100;
    const platformFeeCents = Math.round(priceCents * PLATFORM_COMMISSION_RATE);
    const coachNetCents = priceCents - platformFeeCents;

    const payment = await Payment.create({
      coachId: program.coachId,
      userId: req.user._id,
      programId: program._id,
      amount: amountTL,
      description: program.name,
      status: "Pending",
      commissionRate: PLATFORM_COMMISSION_RATE,
      platformFeeCents,
      coachNetCents,
    });

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

    res.status(200).json({
      checkoutFormContent: result.checkoutFormContent,
      token: result.token,
      paymentId: payment._id,
    });
  } catch (error) {
    res.status(500).json({ message: "Ödeme başlatılamadı", error: error.message });
  }
};
