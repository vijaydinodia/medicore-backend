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
  getHospitalAppointments,
  verifyAppointment,
  getHospitalTestsToCollectFees,
  collectTestFee,
} = require("../controller/appointmentController");
const { auth } = require("../middleware/auth");

router.get("/myAppointments", auth, getMyAppointments);
router.get("/doctorAppointments", auth, getDoctorAppointments);
router.get("/hospitalStats", auth, getHospitalAppointmentStats);
router.get("/hospitalAppointments", auth, getHospitalAppointments);
router.post("/createAppointment", auth, createAppointment);
router.patch("/cancelAppointment/:id", auth, cancelAppointment);
router.patch("/reached/:id", auth, markReached);
router.patch("/shareMedicalHistory/:id", auth, updateShareMedicalHistory);
router.patch("/verifyAppointment/:id", auth, verifyAppointment);
router.get("/hospitalTestsToCollectFees", auth, getHospitalTestsToCollectFees);
router.post("/collectTestFee", auth, collectTestFee);

module.exports = router;
