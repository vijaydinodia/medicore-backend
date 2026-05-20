const express = require("express");
const router = express.Router();

const {
  createDepartment,
  getAllDepartments,
  getSingleDepartment,
  updateDepartment,
  softDeleteDepartment,
  restoreDepartment,
  hardDeleteDepartment,
} = require("../controller/departmentController");

router.post("/createDepartment", createDepartment);
router.get("/getAllDepartments", getAllDepartments);
router.get("/getSingleDepartment/:id", getSingleDepartment);
router.patch("/updateDepartment/:id", updateDepartment);
router.patch("/softDeleteDepartment/:id", softDeleteDepartment);
router.patch("/restoreDepartment/:id", restoreDepartment);
router.delete("/hardDeleteDepartment/:id", hardDeleteDepartment);

module.exports = router;
