const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { sendMessage, getMessages } = require("../controllers/messageController");

router.post("/", protect, sendMessage); // Send a message
router.get("/", protect, getMessages); // Get all messages for the user

module.exports = router;
