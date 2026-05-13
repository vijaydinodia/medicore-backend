const cityModel = require("../model/cityModel");
const districtModel = require("../model/districtModel");

// create city
exports.createCity = async (req, res) => {
  try {
    const { cityName, districtId } = req.body;

    // validation
    if (!(cityName && districtId)) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // check district exists
    const districtExists = await districtModel.findById(districtId);

    if (!districtExists) {
      return res.status(404).json({
        success: false,
        message: "District not found",
      });
    }

    // check city already exists
    const alreadyCreated = await cityModel.findOne({
      cityName: cityName.trim(),
      districtId,
    });

    if (alreadyCreated) {
      return res.status(400).json({
        success: false,
        message: "City already added",
      });
    }

    // create city
    const newCity = await cityModel.create({
      cityName: cityName.trim(),
      districtId,
    });

    return res.status(201).json({
      success: true,
      message: "City created successfully",
      data: newCity,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// get all cities
exports.getAllCity = async (req, res) => {
  try {
    const result = await cityModel.find().populate({
      path: "districtId",
      populate: {
        path: "stateId",
      },
    });

    return res.status(200).json({
      success: true,
      message: "All cities fetched successfully",
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

// get all city by district
exports.getCityByDistrict = async (req, res) => {
  try {
    const { districtId } = req.params;

    // validation
    if (!districtId) {
      return res.status(400).json({
        success: false,
        message: "District id is required",
      });
    }

    // get cities
    const result = await cityModel
      .find({
        districtId,
        status: "active",
      })
      .populate({
        path: "districtId",
        populate: {
          path: "stateId",
        },
      });

    return res.status(200).json({
      success: true,
      message: "Cities fetched successfully",
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
// get one city
exports.getOneCity = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await cityModel.findById(id).populate({
      path: "districtId",
      populate: {
        path: "stateId",
      },
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "City not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "City fetched successfully",
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

// update city
exports.updateCity = async (req, res) => {
  try {
    const { id } = req.params;
    const { cityName } = req.body;

    if (!cityName) {
      return res.status(400).json({
        success: false,
        message: "City name is required",
      });
    }

    const exists = await cityModel.findById(id);

    if (!exists) {
      return res.status(404).json({
        success: false,
        message: "City not found",
      });
    }

    const updatedCity = await cityModel.findByIdAndUpdate(
      id,
      {
        cityName: cityName.trim(),
      },
      {
        new: true,
      },
    );

    return res.status(200).json({
      success: true,
      message: "City updated successfully",
      data: updatedCity,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// delete city
exports.deleteCity = async (req, res) => {
  try {
    const { id } = req.params;

    const exists = await cityModel.findById(id);

    if (!exists) {
      return res.status(404).json({
        success: false,
        message: "City not found",
      });
    }

    await cityModel.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "City deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// soft delete city
exports.softDeleteCity = async (req, res) => {
  try {
    const { id } = req.params;

    const exists = await cityModel.findById(id);

    if (!exists) {
      return res.status(404).json({
        success: false,
        message: "City not found",
      });
    }

    exists.status = "inactive";

    await exists.save();

    return res.status(200).json({
      success: true,
      message: "City deactivated successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// restore city
exports.restoreCity = async (req, res) => {
  try {
    const { id } = req.params;

    const exists = await cityModel.findById(id);

    if (!exists) {
      return res.status(404).json({
        success: false,
        message: "City not found",
      });
    }

    exists.status = "active";

    await exists.save();

    return res.status(200).json({
      success: true,
      message: "City restored successfully",
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
