const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
//state
const {
  createState,
  getAll,
  updateState,
  getOneState,
  deleteState,
  softDeleteState,
  restoreState,
} = require("../controller/stateController");

//district
const {
  createDistrict,
  getAllDistrict,
  getOneDistrict,
  updateDistrict,
  deleteDistrict,
  softDeleteDistrict,
  restoreDistrict,
  getDistrictByState,
} = require("../controller/districtController");

//city
const {
  createCity,
  getAllCity,
  getOneCity,
  updateCity,
  deleteCity,
  softDeleteCity,
  restoreCity,
  getCityByDistrict,
} = require("../controller/cityController");

//state routes
router.post("/state/createState", createState);
router.get("/state/getAll", getAll);
router.patch("/state/updateState/:id", updateState);
router.get("/state/getOneState/:id", getOneState);
router.delete("/state/deleteState/:id", deleteState);
router.patch("/state/softDeleteState/:id", softDeleteState);
router.patch("/state/restoreState/:id", restoreState);

//district routes
router.post("/district/createDistrict", createDistrict);
router.get("/district/getAllDistrict", getAllDistrict);
router.get("/district/getDistrictByState/:stateId", getDistrictByState);
router.get("/district/getOneDistrict/:id", getOneDistrict);
router.patch("/district/updateDistrict/:id", updateDistrict);
router.delete("/district/deleteDistrict/:id", deleteDistrict);
router.patch("/district/softDeleteDistrict/:id", softDeleteDistrict);
router.patch("/district/restoreDistrict/:id", restoreDistrict);

//city routes
router.post("/city/createCity", createCity);
router.get("/city/getAllCity", getAllCity);
router.get("/city/getCityByDistrict/:districtId", getCityByDistrict);
router.get("/city/getOneCity/:id", getOneCity);
router.patch("/city/updateCity/:id", updateCity);
router.delete("/city/deleteCity/:id", deleteCity);
router.patch("/city/softDeleteCity/:id", softDeleteCity);
router.patch("/city/restoreCity/:id", restoreCity);

module.exports = router;
