const express = require("express");
const router = express.Router();

const { getLabTestPatients, saveMedicine } = require("../controller/medicineController");
const { auth } = require("../middleware/auth");

router.get("/labTestPatients", auth, getLabTestPatients);
router.post("/:appointmentId", auth, saveMedicine);

module.exports = router;
