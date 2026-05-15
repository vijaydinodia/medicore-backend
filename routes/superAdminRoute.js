const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");

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
  toggleActiveHospital,
} = require("../controller/superAdminController");

const superAdminOnly = (req, res, next) => {
  if (req.user?.role !== "superAdmin") {
    return res.status(403).json({
      success: false,
      message: "Super admin access required",
    });
  }

  next();
};

router.use(auth, superAdminOnly);

router.get("/hospitals", getHospitals);
router.get("/hospitals/all", getAllHospitals);
router.get("/hospitals/active", getActiveHospitals);
router.get("/hospitals/inactive", getInactiveHospitals);
router.get("/hospitals/deleted", getDeletedHospitals);
router.patch("/hospitals/:id/soft-delete", softDeleteHospital);
router.patch("/hospitals/:id/restore", restoreHospital);
router.patch("/hospitals/:id/toggle-active", toggleActiveHospital);
router.patch("/rejectHospital/:id", rejectHospital);
router.patch("/approveHospital/:id", approveHospital);
router.patch("/hospitals/:id/reject", rejectHospital);
router.patch("/hospitals/:id/approve", approveHospital);

module.exports = router;
