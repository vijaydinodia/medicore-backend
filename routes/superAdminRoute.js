const express = require("express");
const router = express.Router();

const {
  rejectHospital,
  approveHospital,
  getHospitals,
  getAllHospitals,
  getActiveHospitals,
  getInactiveHospitals,
  getDeletedHospitals,
  softDeleteHospital,
  restoreHospital,
} = require("../controller/superAdminController");

router.get("/hospitals", getHospitals);
router.get("/hospitals/all", getAllHospitals);
router.get("/hospitals/active", getActiveHospitals);
router.get("/hospitals/inactive", getInactiveHospitals);
router.get("/hospitals/deleted", getDeletedHospitals);
router.patch("/hospitals/:id/soft-delete", softDeleteHospital);
router.patch("/hospitals/:id/restore", restoreHospital);
router.patch("/rejectHospital/:id", rejectHospital);
router.patch("/approveHospital/:id", approveHospital);

module.exports = router