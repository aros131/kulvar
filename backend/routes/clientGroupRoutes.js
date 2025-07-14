const express = require("express");

const router = express.Router();

const {
   getClientDetails,
  addClientToGroup,
  createGroup,
  getGroups,
  getGroupById,
  deleteGroup,
  removeClientFromGroup,
  searchGroupClients,
  getAllGroupClients,
  searchClients
} = require("../controllers/clientGroupController");
const protect = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// All routes below require coach authentication
router.use(protect, roleMiddleware(["coach"]));

// 🔹 Group management
router.post("/", createGroup);                            // Create group
router.get("/", getGroups);                               // Get all groups
router.get("/:id", getGroupById);                         // Get group by ID
router.delete("/:id", deleteGroup);                       // Delete group

// 🔹 Client management in group
router.get("/clients/all", getAllGroupClients);           // Get all group clients
router.get("/clients/search", searchGroupClients);        // Search clients in groups
router.patch("/:id/remove-client", removeClientFromGroup); // Remove client from group
router.post("/:id/add-client", addClientToGroup);         // Add client to group
router.get("/client/:id", getClientDetails);              // Get client detail (optional)
router.get("/search", protect, roleMiddleware(["coach"]), searchClients);

module.exports = router;
