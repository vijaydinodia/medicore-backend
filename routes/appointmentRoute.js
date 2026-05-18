const express = require("express");
const router = express.Router();

const {
  createAppointment,
  getMyAppointments,
} = require("../controller/appointmentController");
const { auth } = require("../middleware/auth");

router.get("/myAppointments", auth, getMyAppointments);
router.post("/createAppointment", auth, createAppointment);

module.exports = router;
