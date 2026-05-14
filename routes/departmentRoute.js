const expree = require("express");
const router = expree.Router();

const {
  createDepartment,
  getAllDepartments,
  getSingleDepartment,
  updatedDepartment,
  softDeleteDepartment,
  restoreDepartment,
  hardDeleteDepartment,
} = require("../controller/departmentController");

router.post("/createDepartment", createDepartment);
router.get("/getAllDepartments", getAllDepartments);
router.get("/getSingleDepartment/:id", getSingleDepartment);
router.patch("/updatedDepartment/:id", createDepartment);
router.patch("/softDeleteDepartment/:id", softDeleteDepartment);
router.patch("/restoreDepartment/:id", restoreDepartment);
router.delete("/hardDeleteDepartment/:id", hardDeleteDepartment);

module.exports = router;
