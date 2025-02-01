const express = require("express");
const router = express.Router();
const programController = require("../controllers/programController");
const protect = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const {
    createProgram,
    getPrograms,
    getProgramById,
  } = require("../controllers/programController"); 
  const { assignProgramToClients, cloneProgram, trackSessionCompletion } = require("../controllers/programController");
// Program management routes
// ✅ Import Multer (Fix the error)
const multer = require("multer");
const upload = multer({ dest: "uploads/" }); // Change the folder if needed

router.put("/:id", protect, roleMiddleware(["coach"]), programController.updateProgram);
router.get("/:id", protect, getProgramById);

router.delete("/:id", protect, roleMiddleware(["coach"]), programController.deleteProgram);
router.post("/", protect, upload.array("documents"), createProgram);
router.get("/", protect, getPrograms);
router.post("/:programId/assign", protect, assignProgramToClients);
router.post("/:programId/clone", protect, cloneProgram);
router.post("/:programId/track-session", protect, trackSessionCompletion);

module.exports = router;
