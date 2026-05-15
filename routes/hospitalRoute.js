const express = require("express");
const router = express.Router();

const { addHospital } = require("../controller/hospitlaController");
const upload = require("../middleware/upload");

router.post(
  "/addHospital",
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "hospitalImages", maxCount: 8 },
    { name: "hospitalFiles", maxCount: 12 },
  ]),
  addHospital,
);

module.exports = router;
