const express = require("express");
const { createGroup, getGroups, deleteGroup } = require("../controllers/clientGroupController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// POST /groups: Create a new client group
router.post("/", protect, createGroup);

// GET /groups: Get all client groups
router.get("/", protect, getGroups);

// DELETE /groups/:id: Delete a client group
router.delete("/:id", protect, deleteGroup);

module.exports = router;
