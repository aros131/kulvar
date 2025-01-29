const express = require("express");
const router = express.Router();
const programController = require("../controllers/programController");
const protect = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const {
    createProgram,
    getPrograms,
  } = require("../controllers/programController"); 
// Program management routes

router.get("/", protect, roleMiddleware(["coach"]), programController.getPrograms);
router.put("/:id", protect, roleMiddleware(["coach"]), programController.updateProgram);
router.delete("/:id", protect, roleMiddleware(["coach"]), programController.deleteProgram);
router.post("/", protect, upload.array("documents"), createProgram);
router.get("/", protect, getPrograms);
module.exports = router;
