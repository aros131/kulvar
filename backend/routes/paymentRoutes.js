import express from 'express';
const router = express.Router();
import protect from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';
import {
  createInvoice,
  getInvoices,
  getMyInvoices,
  processPayment,
  initializeIyzicoPayment,
  iyzicoCallback,
  buyProgram,
} from '../controllers/paymentController.js';

router.post("/invoice", protect, roleMiddleware(["coach"]), createInvoice);
router.get("/invoices", protect, roleMiddleware(["coach"]), getInvoices);
router.get("/my-invoices", protect, roleMiddleware(["user"]), getMyInvoices);
router.post("/pay", protect, roleMiddleware(["user"]), processPayment);

router.post("/iyzico/initialize", protect, roleMiddleware(["user"]), initializeIyzicoPayment);
router.post("/program/:programId/buy", protect, roleMiddleware(["user"]), buyProgram);
// Public: iyzico's server posts the result here directly, no auth header available.
router.post("/iyzico/callback", iyzicoCallback);

export default router;
