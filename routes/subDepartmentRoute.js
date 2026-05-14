const express = require("express");

const router = express.Router();

const {
  createSubDepartment,
  getAllSubDepartments,
  getSingleSubDepartment,
  updateSubDepartment,
  softDeleteSubDepartment,
  restoreSubDepartment,
  hardDeleteSubDepartment,
} = require("../controller/subDepartmentController");

router.post("/createSubDepartment", createSubDepartment);
router.get("/getAllSubDepartments", getAllSubDepartments);
router.get("/getSingleSubDepartment/:id", getSingleSubDepartment);
router.patch("/updateSubDepartment/:id", updateSubDepartment);
router.patch("/softDeleteSubDepartment/:id", softDeleteSubDepartment);
router.patch("/restoreSubDepartment/:id", restoreSubDepartment);
router.delete("/hardDeleteSubDepartment/:id", hardDeleteSubDepartment);

module.exports = router;
