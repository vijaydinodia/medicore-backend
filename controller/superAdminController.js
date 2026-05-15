const hospital = require("../model/hospitalModel");
const User = require("../model/userModel");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const { hospitalApprovedTemplate } = require("../templates/hospitalApproved");
const mailSender = require("../utils/mailSender");

const saltRounds = 10;

const generateRandomPassword = () => {
  return uuidv4().replace(/-/g, "").slice(0, 12);
};

const isValidHospitalId = (id) => {
  return id && require("mongoose").Types.ObjectId.isValid(id);
};

//reject hospital
exports.rejectHospital = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidHospitalId(id)) {
      return res.status(400).json({
        success: false,
        message: "Valid hospital id is required",
      });
    }

    const existingHospital = await hospital.findById(id);

    if (!existingHospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found",
      });
    }

    if (existingHospital.isDeleted) {
      return res.status(400).json({
        success: false,
        message: "Deleted hospital cannot be rejected",
      });
    }

    if (existingHospital.status === "rejected") {
      return res.status(200).json({
        success: true,
        message: "Hospital already rejected",
        data: existingHospital,
      });
    }

    existingHospital.status = "rejected";
    await existingHospital.save();

    return res.status(200).json({
      success: true,
      message: "Hospital rejected successfully",
      data: existingHospital,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// get hospitals
exports.getHospitals = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { isDeleted: false };

    if (status && status !== "all") {
      filter.status = status;
    }

    const hospitals = await hospital.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: hospitals,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// get all hospitals
exports.getAllHospitals = async (req, res) => {
  try {
    const hospitals = await hospital.find({ isDeleted: false }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: hospitals,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// get active hospitals
exports.getActiveHospitals = async (req, res) => {
  try {
    const hospitals = await hospital.find({ isDeleted: false, isActive: true }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: hospitals,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// get inactive hospitals
exports.getInactiveHospitals = async (req, res) => {
  try {
    const hospitals = await hospital.find({ isDeleted: false, isActive: false }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: hospitals,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// get deleted hospitals
exports.getDeletedHospitals = async (req, res) => {
  try {
    const hospitals = await hospital.find({ isDeleted: true }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: hospitals,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// soft delete hospital
exports.softDeleteHospital = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidHospitalId(id)) {
      return res.status(400).json({
        success: false,
        message: "Valid hospital id is required",
      });
    }

    const existingHospital = await hospital.findById(id);

    if (!existingHospital || existingHospital.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found",
      });
    }

    existingHospital.isDeleted = true;
    await existingHospital.save();

    return res.status(200).json({
      success: true,
      message: "Hospital soft deleted successfully",
      data: existingHospital,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// restore soft deleted hospital
exports.restoreHospital = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidHospitalId(id)) {
      return res.status(400).json({
        success: false,
        message: "Valid hospital id is required",
      });
    }

    const existingHospital = await hospital.findById(id);

    if (!existingHospital || !existingHospital.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found or not deleted",
      });
    }

    existingHospital.isDeleted = false;
    await existingHospital.save();

    return res.status(200).json({
      success: true,
      message: "Hospital restored successfully",
      data: existingHospital,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// approve hospital
exports.approveHospital = async (req, res) => {
  try {
    const { id } = req.params;

    // validation
    if (!isValidHospitalId(id)) {
      return res.status(400).json({
        success: false,
        message: "Valid hospital id is required",
      });
    }

    const existingHospital = await hospital.findById(id);

    if (!existingHospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found",
      });
    }

    if (existingHospital.isDeleted) {
      return res.status(400).json({
        success: false,
        message: "Deleted hospital cannot be approved",
      });
    }

    if (existingHospital.status === "approved") {
      return res.status(200).json({
        success: true,
        message: "Hospital already approved",
        data: {
          hospital: existingHospital,
        },
      });
    }

    const hospitalPassword = generateRandomPassword();
    const passwordHash = await bcrypt.hash(hospitalPassword, saltRounds);

    const hospitalEmail = existingHospital.email.toLowerCase().trim();
    const hospitalPhone = existingHospital.phone.trim();
    let approvedUser = await User.findOne({
      $or: [{ email: hospitalEmail }, { phone: hospitalPhone }],
    });

    if (approvedUser && approvedUser.email !== hospitalEmail) {
      return res.status(400).json({
        success: false,
        message: "Hospital phone is already used by another user",
      });
    }

    if (approvedUser && approvedUser.role === "superAdmin") {
      return res.status(400).json({
        success: false,
        message: "Cannot assign hospital account to super admin email",
      });
    }

    if (approvedUser) {
      approvedUser.password = passwordHash;
      approvedUser.role = "admin";
      approvedUser.hospitalId = existingHospital._id;
      if (req.user?._id) {
        approvedUser.createdBy = req.user._id;
      }
      await approvedUser.save();
    } else {
      approvedUser = await User.create({
        name: existingHospital.hospitalName.trim(),
        email: hospitalEmail,
        phone: hospitalPhone,
        age: 18,
        gender: "other",
        role: "admin",
        password: passwordHash,
        hospitalId: existingHospital._id,
        createdBy: req.user?._id,
      });
    }

    existingHospital.status = "approved";
    existingHospital.isActive = true;
    existingHospital.isDeleted = false;
    await existingHospital.save();

    try {
      await mailSender(
        existingHospital.email,
        "Hospital Approved Successfully",
        hospitalApprovedTemplate(
          existingHospital.hospitalName,
          existingHospital.email,
          hospitalPassword,
        ),
      );
    } catch (mailErr) {
      console.log("Email send error:", mailErr.message);
    }

    return res.status(200).json({
      success: true,
      message: "Hospital approved successfully",
      data: {
        hospital: existingHospital,
        user: approvedUser,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// toggle hospital active/inactive
exports.toggleActiveHospital = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidHospitalId(id)) {
      return res.status(400).json({
        success: false,
        message: "Valid hospital id is required",
      });
    }

    const existingHospital = await hospital.findById(id);

    if (!existingHospital || existingHospital.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found",
      });
    }

    existingHospital.isActive = !existingHospital.isActive;
    await existingHospital.save();

    return res.status(200).json({
      success: true,
      message: existingHospital.isActive
        ? "Hospital activated successfully"
        : "Hospital deactivated successfully",
      data: existingHospital,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};
