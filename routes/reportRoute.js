const express = require("express");
const router = express.Router();

const {
  createReport,
  getAllReports,
  getOneReport,
  getSingleReport,
  updateReport,
  deleteReport,
} = require("../controller/reportController");
const { auth } = require("../middleware/auth");
const upload = require("../middleware/upload");

router.post("/createReport", auth, upload.single("reportFile"), createReport);
router.get("/getAllReports", auth, getAllReports);
router.get("/getOneReport/:id", auth, getOneReport);
router.get("/getSingleReport/:id", auth, getSingleReport);
router.patch("/updateReport/:id", auth, updateReport);
router.delete("/deleteReport/:id", auth, deleteReport);

module.exports = router;
