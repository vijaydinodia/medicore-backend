const express = require("express");
const router = express.Router();

const { downloadStatReport } = require("../controller/statReportController");
const { auth } = require("../middleware/auth");

router.post("/download", auth, downloadStatReport);

module.exports = router;
