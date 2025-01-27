const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { createGroup, getGroups, addClientToGroup } = require("../controllers/clientGroupController");
const { getGroupById } = require("../controllers/clientGroupController");

router.post("/", protect, roleMiddleware(["coach"]), createGroup); // Create a new client group
router.get("/", protect, roleMiddleware(["coach"]), getGroups); // Get all client groups
router.post("/:id/add-client", protect, roleMiddleware(["coach"]), addClientToGroup); // Add a client to a group
router.get("/:id", protect, roleMiddleware(["coach"]), getGroupById);

module.exports = router;
