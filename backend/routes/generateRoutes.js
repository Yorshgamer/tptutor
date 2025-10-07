const express = require("express");
const { generateQA } = require("../controllers/generateController");

const router = express.Router();
router.post("/", generateQA);

module.exports = router;
