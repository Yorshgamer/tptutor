const express = require("express");
const { evaluateOpen } = require("../controllers/evaluateController");

const router = express.Router();
router.post("/", evaluateOpen);

module.exports = router;
