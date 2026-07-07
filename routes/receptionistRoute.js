const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const { auth } = require("../middleware/auth");

const {
  createReceptionist,
  getAllReceptionists,
  getSingleReceptionist,
  updateReceptionist,
  softDeleteReceptionist,
  restoreReceptionist,
  hardDeleteReceptionist,
} = require("../controller/receptionistController");

// Create receptionist
router.post(
  "/createReceptionist",
  auth,
  upload.single("profileImage"),
  createReceptionist,
);

// Get all receptionists
router.get("/getAllReceptionists", getAllReceptionists);

// Get single receptionist
router.get("/getSingleReceptionist/:id", getSingleReceptionist);

// Update receptionist
router.patch(
  "/updateReceptionist/:id",
  auth,
  upload.single("profileImage"),
  updateReceptionist,
);

// Soft delete receptionist
router.patch("/softDeleteReceptionist/:id", auth, softDeleteReceptionist);

// Restore receptionist
router.patch("/restoreReceptionist/:id", auth, restoreReceptionist);

// Hard delete receptionist
router.delete("/hardDeleteReceptionist/:id", auth, hardDeleteReceptionist);

module.exports = router;
