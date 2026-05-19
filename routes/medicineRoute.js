const express = require("express");
const router = express.Router();

const { saveMedicine } = require("../controller/medicineController");
const { auth } = require("../middleware/auth");

router.post("/:appointmentId", auth, saveMedicine);

module.exports = router;
