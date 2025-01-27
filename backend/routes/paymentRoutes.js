const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { createInvoice, getInvoices, processPayment } = require("../controllers/paymentController");

router.post("/invoice", protect, roleMiddleware(["coach"]), createInvoice); // Create an invoice for clients
router.get("/invoices", protect, roleMiddleware(["coach"]), getInvoices); // Get all invoices
router.post("/pay", protect, roleMiddleware(["user"]), processPayment); // Process a payment

module.exports = router;
