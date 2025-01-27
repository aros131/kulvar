const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware"); // Ensure this exists and is correct
const contentController = require("../controllers/contentController"); // Ensure this exists and is correct

// Define routes
router.get("/", protect, contentController.getContents); // Ensure `getContents` is defined
router.post("/", protect, contentController.createContent); // Ensure `createContent` is defined

module.exports = router;
