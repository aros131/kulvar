import express from 'express';
const router = express.Router();
import protect from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';
import { createInvoice, getInvoices, processPayment } from '../controllers/paymentController.js';

router.post("/invoice", protect, roleMiddleware(["coach"]), createInvoice); // Create an invoice for clients
router.get("/invoices", protect, roleMiddleware(["coach"]), getInvoices); // Get all invoices
router.post("/pay", protect, roleMiddleware(["user"]), processPayment); // Process a payment

export default router;
