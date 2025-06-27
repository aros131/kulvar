const express = require("express");
const router = express.Router();
const { getCoaches } = require("../controllers/coachController");

router.get("/", getCoaches);

module.exports = router;
