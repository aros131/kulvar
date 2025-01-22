const express = require("express");
const { createGroup, getGroups, updateGroup, deleteGroup } = require("../controllers/clientGroupController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// POST /groups: Create a new group
router.post("/", protect, createGroup);

// GET /groups: Fetch all groups for the logged-in coach
router.get("/", protect, getGroups);

// PUT /groups/:id: Update a group
router.put("/:id", protect, updateGroup);

// DELETE /groups/:id: Delete a group
router.delete("/:id", protect, deleteGroup);

module.exports = router;
