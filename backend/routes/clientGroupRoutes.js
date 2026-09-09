import express from 'express';

const router = express.Router();

import {
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
} from '../controllers/clientGroupController.js';
import protect from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';

// All routes below require coach authentication
router.use(protect, roleMiddleware(["coach"]));

// 🔹 Group management
router.post("/", createGroup);                            // Create group
router.get("/", getGroups);                               // Get all groups

// 🔹 Client management in group — static paths must come before "/:id" so they aren't
// swallowed by the generic id route (Express matches in registration order).
router.get("/clients/all", getAllGroupClients);           // Get all group clients
router.get("/clients/search", searchGroupClients);        // Search clients in groups
router.get("/client/:id", getClientDetails);              // Get client detail (optional)
router.get("/search", searchClients);

router.get("/:id", getGroupById);                         // Get group by ID
router.delete("/:id", deleteGroup);                       // Delete group
router.patch("/:id/remove-client", removeClientFromGroup); // Remove client from group
router.post("/:id/add-client", addClientToGroup);         // Add client to group

export default router;
