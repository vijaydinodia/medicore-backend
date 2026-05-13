const express = require("express");
const router = express.Router();

const {
  signup,
  login,
  forget,
  verifyOtp,
  resetPassword,
  editProfile,
} = require("../controller/userController");
const { auth } = require("../middleware/auth");

router.post("/signup", signup);
router.post("/login", login);
router.post("/forget", forget);
router.post("/verifyOtp", verifyOtp);
router.patch("/resetPassword", resetPassword);
router.patch("/editProfile", auth, editProfile);

module.exports = router;