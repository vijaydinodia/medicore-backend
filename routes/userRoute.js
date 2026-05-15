const express = require("express");
const router = express.Router();

const {
  signup,
  login,
  forget,
  verifyOtp,
  resetPassword,
  editProfile,
  changePassword,
} = require("../controller/userController");
const { auth } = require("../middleware/auth");
const upload = require("../middleware/upload");

router.post("/signup", signup);
router.post("/login", login);
router.post("/forget", forget);
router.post("/verifyOtp", verifyOtp);
router.patch("/resetPassword", resetPassword);
router.patch("/changePassword", auth, changePassword);
router.patch("/editProfile", auth, upload.single("profileImage"), editProfile);

module.exports = router;
