const express = require("express");
const router = express.Router();

const {
  cancelAppointment,
  createAppointment,
  getDoctorAppointments,
  getHospitalAppointmentStats,
  getMyAppointments,
  markReached,
  updateShareMedicalHistory,
} = require("../controller/appointmentController");
const { auth } = require("../middleware/auth");

router.get("/myAppointments", auth, getMyAppointments);
router.get("/doctorAppointments", auth, getDoctorAppointments);
router.get("/hospitalStats", auth, getHospitalAppointmentStats);
router.post("/createAppointment", auth, createAppointment);
router.patch("/cancelAppointment/:id", auth, cancelAppointment);
router.patch("/reached/:id", auth, markReached);
router.patch("/shareMedicalHistory/:id", auth, updateShareMedicalHistory);

module.exports = router;
