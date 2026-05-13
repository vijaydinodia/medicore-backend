const stateModel = require("../model/stateModel");
const districtModel = require("../model/districtModel");
const mongoose = require("mongoose");

//create state
exports.createState = async (req, res) => {
  try {
    const { stateName } = req.body;

    if (!stateName) {
      return res.status(400).json({
        success: false,
        message: "All field are required",
      });
    }

    const alreadyCreated = await stateModel.findOne({
      stateName: stateName.trim(),
    });

    if (alreadyCreated) {
      return res.status(400).json({
        success: false,
        message: "State already added",
      });
    }

    await stateModel.create({ stateName: stateName.trim() });

    return res.status(200).json({
      message: "New state created",
      stateName: stateName,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

//get all

exports.getAll = async (req, res) => {
  try {
    const result = await stateModel.find();

    return res.status(200).json({
      success: true,
      message: "All states fetched successfully",
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

//update state
exports.updateState = async (req, res) => {
  try {
    const { id } = req.params;
    const { stateName } = req.body;

    // validation
    if (!stateName) {
      return res.status(400).json({
        success: false,
        message: "State name is required",
      });
    }

    // check state exists
    const exists = await stateModel.findById(id);

    if (!exists) {
      return res.status(404).json({
        success: false,
        message: "State not found",
      });
    }

    // update state
    const updatedState = await stateModel.findByIdAndUpdate(
      id,
      {
        stateName: stateName.trim(),
      },
      {
        new: true,
      },
    );

    // response
    return res.status(200).json({
      success: true,
      message: "State updated successfully",
      data: updatedState,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

//getOne
exports.getOneState = async (req, res) => {
  try {
    const { id } = req.params;

    // validation
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "State id is required",
      });
    }

    // find state
    const result = await stateModel.findById(id);

    // check exists
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "State not found",
      });
    }

    // response
    return res.status(200).json({
      success: true,
      message: "State fetched successfully",
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

//delete state
exports.deleteState = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { id } = req.params;

    // validation
    if (!id) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "State id is required",
      });
    }

    // check state exists
    const exists = await stateModel.findById(id).session(session);

    if (!exists) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "State not found",
      });
    }

    // get districts
    const districts = await districtModel
      .find({ stateId: id })
      .session(session);

    // district ids
    const districtIds = districts.map((district) => district._id);

    // delete cities
    await cityModel
      .deleteMany({
        districtId: {
          $in: districtIds,
        },
      })
      .session(session);

    // delete districts
    await districtModel
      .deleteMany({
        stateId: id,
      })
      .session(session);

    // delete state
    await stateModel.findByIdAndDelete(id).session(session);

    // commit transaction
    await session.commitTransaction();

    session.endSession();

    return res.status(200).json({
      success: true,
      message: "State, districts and cities deleted successfully",
    });
  } catch (err) {
    // rollback
    await session.abortTransaction();

    session.endSession();

    return res.status(500).json({
      success: false,
      message: "Transaction failed",
      error: err.message,
    });
  }
};

//softDelete

exports.softDeleteState = async (req, res) => {
  try {
    const { id } = req.params;

    // validation
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "State id is required",
      });
    }

    // check state exists
    const exists = await stateModel.findById(id);

    if (!exists) {
      return res.status(404).json({
        success: false,
        message: "State not found",
      });
    }

    // already inactive
    if (exists.status === "inactive") {
      return res.status(400).json({
        success: false,
        message: "State already inactive",
      });
    }

    // update status
    exists.status = "inactive";

    await exists.save();

    return res.status(200).json({
      success: true,
      message: "State deactivated successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// restore state
exports.restoreState = async (req, res) => {
  try {
    const { id } = req.params;

    // validation
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "State id is required",
      });
    }

    // check state exists
    const exists = await stateModel.findById(id);

    if (!exists) {
      return res.status(404).json({
        success: false,
        message: "State not found",
      });
    }

    // already active
    if (exists.status === "active") {
      return res.status(400).json({
        success: false,
        message: "State already active",
      });
    }

    // restore state
    exists.status = "active";

    await exists.save();

    // response
    return res.status(200).json({
      success: true,
      message: "State restored successfully",
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
