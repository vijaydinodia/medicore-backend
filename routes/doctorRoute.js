const express = require("express");

const router = express.Router();

const {
  createDoctor,
  getAllDoctors,
  getSingleDoctor,
  updateDoctor,
  softDeleteDoctor,
  restoreDoctor,
  hardDeleteDoctor,
} = require("../controller/doctorController");

router.post("/createDoctor", createDoctor);
router.get("/getAllDoctors", getAllDoctors);
router.get("/getSingleDoctor/:id", getSingleDoctor);
router.patch("/updateDoctor/:id", updateDoctor);
router.patch("/softDeleteDoctor/:id", softDeleteDoctor);
router.patch("/restoreDoctor/:id", restoreDoctor);
router.delete("/hardDeleteDoctor/:id", hardDeleteDoctor);

module.exports = router;
