const express = require("express");
const router = express.Router();

const {
  createMedical,
  createMedicalStore,
  getAllMedicalStores,
  getAllMedicals,
  getSingleMedical,
  updateMedical,
  deleteMedical,
  softDeleteMedical,
  restoreMedical,
  hardDeleteMedical,
  buyMedical,
  getMyMedicalOrders,
  getHospitalMedicalOrders,
  updateMedicalOrderStatus,
} = require("../controller/medicalController");
const { auth } = require("../middleware/auth");

router.post("/createMedical", auth, createMedical);
router.post("/createMedicalStore", auth, createMedicalStore);
router.get("/getAllMedicalStores", auth, getAllMedicalStores);
router.get("/getAllMedicals", auth, getAllMedicals);
router.get("/getSingleMedical/:id", auth, getSingleMedical);
router.patch("/updateMedical/:id", auth, updateMedical);
router.delete("/deleteMedical/:id", auth, deleteMedical);
router.patch("/softDeleteMedical/:id", auth, softDeleteMedical);
router.patch("/restoreMedical/:id", auth, restoreMedical);
router.delete("/hardDeleteMedical/:id", auth, hardDeleteMedical);
router.post("/buyMedical/:id", auth, buyMedical);
router.get("/myOrders", auth, getMyMedicalOrders);
router.get("/hospitalOrders", auth, getHospitalMedicalOrders);
router.patch("/updateOrderStatus/:id", auth, updateMedicalOrderStatus);

module.exports = router;
