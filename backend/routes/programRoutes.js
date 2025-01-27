const express = require("express");
const router = express.Router();
const programController = require("../controllers/programController");
const protect = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Program management routes
router.post("/", protect, roleMiddleware(["coach"]), programController.createProgram);
router.get("/", protect, roleMiddleware(["coach"]), programController.getPrograms);
router.put("/:id", protect, roleMiddleware(["coach"]), programController.updateProgram);
router.delete("/:id", protect, roleMiddleware(["coach"]), programController.deleteProgram);

module.exports = router;
