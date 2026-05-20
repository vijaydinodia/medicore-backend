const express = require("express");
const router = express.Router();

const {
  createTest,
  getAllTests,
  getOneTest,
  getSingleTest,
  updateTest,
  deleteTest,
  softDeleteTest,
  restoreTest,
  hardDeleteTest,
} = require("../controller/testController");
const { auth } = require("../middleware/auth");

router.post("/createTest", auth, createTest);
router.get("/getAllTests", auth, getAllTests);
router.get("/getOneTest/:id", auth, getOneTest);
router.get("/getSingleTest/:id", auth, getSingleTest);
router.patch("/updateTest/:id", auth, updateTest);
router.delete("/deleteTest/:id", auth, deleteTest);
router.patch("/softDeleteTest/:id", auth, softDeleteTest);
router.patch("/restoreTest/:id", auth, restoreTest);
router.delete("/hardDeleteTest/:id", auth, hardDeleteTest);

module.exports = router;
