const express = require("express");
const router = express.Router();
const multer = require("multer");

const { addHospital, getAllHospital } = require("../controller/hospitlaController");
const upload = require("../middleware/upload");

const hospitalUpload = upload.fields([
  { name: "logo", maxCount: 1 },
  { name: "hospitalImages", maxCount: 8 },
  { name: "hospitalFiles", maxCount: 12 },
]);

const handleUpload = (req, res, next) => {
  hospitalUpload(req, res, (error) => {
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
  "/addHospital",
  handleUpload,
  addHospital,
);
router.get("/getAllHospital", getAllHospital);

module.exports = router;
