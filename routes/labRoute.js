const express = require("express");
const router = express.Router();

const {
  createLab,
  getAllLabs,
  getOneLab,
  getSingleLab,
  updateLab,
  deleteLab,
  softDeleteLab,
  restoreLab,
  hardDeleteLab,
} = require("../controller/labController");
const { auth } = require("../middleware/auth");

router.post("/createLab", auth, createLab);
router.get("/getAllLabs", auth, getAllLabs);
router.get("/getOneLab/:id", auth, getOneLab);
router.get("/getSingleLab/:id", auth, getSingleLab);
router.patch("/updateLab/:id", auth, updateLab);
router.delete("/deleteLab/:id", auth, deleteLab);
router.patch("/softDeleteLab/:id", auth, softDeleteLab);
router.patch("/restoreLab/:id", auth, restoreLab);
router.delete("/hardDeleteLab/:id", auth, hardDeleteLab);

module.exports = router;
