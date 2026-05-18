const express = require("express");
const multer = require("multer");

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
const upload = require("../middleware/upload");

const doctorUpload = upload.fields([
  { name: "profileImage", maxCount: 1 },
  { name: "doctorImages", maxCount: 8 },
  { name: "doctorFiles", maxCount: 8 },
]);

const handleUpload = (req, res, next) => {
  doctorUpload(req, res, (error) => {
    if (!error) return next();

    const isTooLarge = error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE";

    return res.status(400).json({
      success: false,
      message: isTooLarge
        ? "One of the uploaded files is too large. Please upload files under 30 MB."
        : error.message || "Unable to upload files.",
    });
  });
};

router.post(
  "/createDoctor",
  handleUpload,
  createDoctor,
);
router.get("/getAllDoctors", getAllDoctors);
router.get("/getSingleDoctor/:id", getSingleDoctor);
router.patch("/updateDoctor/:id", updateDoctor);
router.patch("/softDeleteDoctor/:id", softDeleteDoctor);
router.patch("/restoreDoctor/:id", restoreDoctor);
router.delete("/hardDeleteDoctor/:id", hardDeleteDoctor);

module.exports = router;
