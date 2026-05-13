const districtModel = require("../model/districtModel");
const stateModel = require("../model/stateModel");
const cityModel = require("../model/cityModel");

// create district
exports.createDistrict = async (req, res) => {
  try {
    const { districtName, stateId } = req.body;

    // validation
    if (!(districtName && stateId)) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // check state exists
    const stateExists = await stateModel.findById(stateId);

    if (!stateExists) {
      return res.status(404).json({
        success: false,
        message: "State not found",
      });
    }

    // check district already exists
    const alreadyCreated = await districtModel.findOne({
      districtName: districtName.trim(),
      stateId,
    });

    if (alreadyCreated) {
      return res.status(400).json({
        success: false,
        message: "District already added",
      });
    }

    // create district
    const newDistrict = await districtModel.create({
      districtName: districtName.trim(),
      stateId,
    });

    return res.status(201).json({
      success: true,
      message: "District created successfully",
      data: newDistrict,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// get all districts
exports.getAllDistrict = async (req, res) => {
  try {
    const result = await districtModel.find().populate("stateId");

    return res.status(200).json({
      success: true,
      message: "All districts fetched successfully",
      total: result.length,
      data: result,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// get all district by state
exports.getDistrictByState = async (req, res) => {
  try {
    const { stateId } = req.params;

    // validation
    if (!stateId) {
      return res.status(400).json({
        success: false,
        message: "State id is required",
      });
    }

    // get districts
    const result = await districtModel
      .find({
        stateId: stateId,
        status: "active",
      })
      .populate("stateId");

    return res.status(200).json({
      success: true,
      message:
        "Districts fetched successfully",
      total: result.length,
      data: result,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// get one district
exports.getOneDistrict = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await districtModel.findById(id).populate("stateId");

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "District not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "District fetched successfully",
      data: result,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// update district
exports.updateDistrict = async (req, res) => {
  try {
    const { id } = req.params;
    const { districtName } = req.body;

    if (!districtName) {
      return res.status(400).json({
        success: false,
        message: "District name is required",
      });
    }

    const exists = await districtModel.findById(id);

    if (!exists) {
      return res.status(404).json({
        success: false,
        message: "District not found",
      });
    }

    const updatedDistrict = await districtModel.findByIdAndUpdate(
      id,
      {
        districtName: districtName.trim(),
      },
      {
        new: true,
      },
    );

    return res.status(200).json({
      success: true,
      message: "District updated successfully",
      data: updatedDistrict,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// delete district
exports.deleteDistrict = async (req, res) => {
  try {
    const { id } = req.params;

    const exists = await districtModel.findById(id);

    if (!exists) {
      return res.status(404).json({
        success: false,
        message: "District not found",
      });
    }

    // delete cities
    await cityModel.deleteMany({
      districtId: id,
    });

    // delete district
    await districtModel.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "District and cities deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// soft delete district
exports.softDeleteDistrict = async (req, res) => {
  try {
    const { id } = req.params;

    const exists = await districtModel.findById(id);

    if (!exists) {
      return res.status(404).json({
        success: false,
        message: "District not found",
      });
    }

    exists.status = "inactive";

    await exists.save();

    return res.status(200).json({
      success: true,
      message: "District deactivated successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// restore district
exports.restoreDistrict = async (req, res) => {
  try {
    const { id } = req.params;

    const exists = await districtModel.findById(id);

    if (!exists) {
      return res.status(404).json({
        success: false,
        message: "District not found",
      });
    }

    exists.status = "active";

    await exists.save();

    return res.status(200).json({
      success: true,
      message: "District restored successfully",
      data: exists,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};
