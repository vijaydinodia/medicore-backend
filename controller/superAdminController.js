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

//reject hospital
exports.rejectHospital = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Hospital id is required",
      });
    }

    const existingHospital = await hospital.findById(id);

    if (!existingHospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found",
      });
    }

    if (existingHospital.status === "rejected") {
      return res.status(400).json({
        success: false,
        message: "Hospital already rejected",
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

// get all hospitals (including active/inactive except soft deleted)
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

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Hospital id is required",
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

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Hospital id is required",
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
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Hospital id is required",
      });
    }

    const existingHospital = await hospital.findById(id);

    if (!existingHospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found",
      });
    }

    if (existingHospital.status === "approved") {
      return res.status(400).json({
        success: false,
        message: "Hospital already approved",
      });
    }

    const hospitalPassword = generateRandomPassword();
    const passwordHash = await bcrypt.hash(hospitalPassword, saltRounds);

    let approvedUser = await User.findOne({ email: existingHospital.email });

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
      if (req.user && req.user.id) {
        approvedUser.createdBy = req.user.id;
      }
      await approvedUser.save();
    } else {
      approvedUser = await User.create({
        name: existingHospital.hospitalName.trim(),
        email: existingHospital.email.toLowerCase().trim(),
        phone: existingHospital.phone.trim(),
        age: 18,
        gender: "other",
        role: "admin",
        password: passwordHash,
        hospitalId: existingHospital._id,
        createdBy: req.user?.id,
      });
    }

    existingHospital.status = "approved";
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
