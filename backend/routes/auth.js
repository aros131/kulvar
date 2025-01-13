const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/auth");

// User registration route
router.post("/register", register);

// User login route
router.post("/login", login);

module.exports = router;
