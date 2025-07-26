import Payment from '../models/Payment.js';

export const createInvoice = async (req, res) => {
  try {
    const { userId, amount, description } = req.body;
    const invoice = await Payment.create({
      coachId: req.user.id,
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
    const invoices = await Payment.find({ coachId: req.user.id });
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
