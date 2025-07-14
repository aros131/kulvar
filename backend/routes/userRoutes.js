const express = require("express");
const router = express.Router();
const { searchClients } = require("../controllers/clientGroupController"); // ya da ayrı controller yazacaksan oradan

const protect = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// 🆕 Tüm kullanıcıları (role: user) aramak için route
router.get("/clients", protect, roleMiddleware(["coach"]), searchClients);

module.exports = router;
