const express = require("express");
const router = express.Router();

const { addHospital } = require("../controller/hospitlaController");

router.post("/addHospital", addHospital);

module.exports = router;
