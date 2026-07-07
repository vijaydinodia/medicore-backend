const Receptionist = require("../model/receptionistModel");
const User = require("../model/userModel");
const Hospital = require("../model/hospitalModel");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const mailSender = require("../utils/mailSender");
const receptionistMailTemplate = require("../templates/receptionistMailTemplate");
const { uploadImage } = require("../utils/cloudnairy");

// Create Receptionist
exports.createReceptionist = async (req, res) => {
  try {
    const {
      hospitalId,
      receptionistName,
      receptionistCode,
      email,
      phone,
      alternatePhone,
      gender,
      dateOfBirth,
      qualification,
      experience,
      address,
      status,
    } = req.body;

    // validation
    if (!(hospitalId && receptionistName && receptionistCode && email && phone)) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();
    const normalizedCode = receptionistCode.trim();

    // Check existing receptionist or user
    const alreadyExists = await Receptionist.findOne({
      $or: [
        { email: normalizedEmail },
        { receptionistCode: normalizedCode },
      ],
    });

    const existingUser = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { phone: normalizedPhone },
      ],
    });

    if (alreadyExists || existingUser) {
      return res.status(400).json({
        success: false,
        message: alreadyExists 
          ? "Receptionist with this email or code already exists" 
          : "User with this email or phone already exists",
      });
    }

    // Check hospital
    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found",
      });
    }

    if (hospital.isDeleted || hospital.isActive === false || hospital.status !== "approved") {
      return res.status(400).json({
        success: false,
        message: "Cannot add receptionist because this hospital is inactive or not approved",
      });
    }

    // Handle single profile image upload
    let profileImageUrl = "";
    if (req.file) {
      const uploadResults = await uploadImage(req.file, "medicore/receptionists/profile");
      if (uploadResults && uploadResults[0]) {
        profileImageUrl = uploadResults[0].secure_url;
      }
    }

    // Generate random password
    const plainPassword = uuidv4().replace(/-/g, "").slice(0, 8);

    // Hash password
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Create receptionist
    const newReceptionist = await Receptionist.create({
      hospitalId,
      receptionistName: receptionistName.trim(),
      receptionistCode: normalizedCode,
      email: normalizedEmail,
      phone: normalizedPhone,
      alternatePhone: alternatePhone || "",
      gender: gender || undefined,
      dateOfBirth: dateOfBirth || null,
      qualification: qualification || "",
      experience: experience ? Number(experience) : 0,
      address: address || "",
      profileImage: profileImageUrl,
      status: status || "active",
    });

    // Create corresponding user login account
    const newUser = await User.create({
      name: receptionistName.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      age: 18,
      gender: gender || "other",
      role: "receptionist",
      hospitalId,
      receptionistId: newReceptionist._id,
      profileImage: profileImageUrl,
      password: hashedPassword,
    });

    // Link userId in receptionist model
    newReceptionist.userId = newUser._id;
    await newReceptionist.save();

    // Send credentials via email
    await mailSender(
      normalizedEmail,
      "Receptionist Account Created Successfully",
      receptionistMailTemplate({
        receptionistName,
        email: normalizedEmail,
        password: plainPassword,
        receptionistCode: normalizedCode,
        hospitalName: hospital.hospitalName,
      })
    );

    return res.status(201).json({
      success: true,
      message: "Receptionist created and email sent successfully",
      data: {
        receptionist: newReceptionist,
        user: newUser,
      },
    });

  } catch (err) {
    console.error("Create receptionist failed:", err);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// Get All Receptionists
exports.getAllReceptionists = async (req, res) => {
  try {
    const receptionists = await Receptionist.find({ isDeleted: false })
      .populate("hospitalId");

    return res.status(200).json({
      success: true,
      count: receptionists.length,
      data: receptionists,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// Get Single Receptionist
exports.getSingleReceptionist = async (req, res) => {
  try {
    const { id } = req.params;
    const receptionist = await Receptionist.findById(id).populate("hospitalId");

    if (!receptionist || receptionist.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Receptionist not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: receptionist,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// Update Receptionist
exports.updateReceptionist = async (req, res) => {
  try {
    const { id } = req.params;
    const existingReceptionist = await Receptionist.findById(id);

    if (!existingReceptionist || existingReceptionist.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Receptionist not found",
      });
    }

    // Check code/email duplicates if changed
    if (req.body.receptionistCode && req.body.receptionistCode !== existingReceptionist.receptionistCode) {
      const duplicate = await Receptionist.findOne({ receptionistCode: req.body.receptionistCode, _id: { $ne: id } });
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: "Receptionist code already exists",
        });
      }
    }

    if (req.body.email && req.body.email.toLowerCase() !== existingReceptionist.email) {
      const duplicate = await Receptionist.findOne({ email: req.body.email.toLowerCase(), _id: { $ne: id } });
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }
    }

    // Handle single profile image upload
    if (req.file) {
      const uploadResults = await uploadImage(req.file, "medicore/receptionists/profile");
      if (uploadResults && uploadResults[0]) {
        req.body.profileImage = uploadResults[0].secure_url;
      }
    }

    const updatedReceptionist = await Receptionist.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true }
    );

    // Also update corresponding user profile details if they exist
    if (updatedReceptionist.userId) {
      await User.findByIdAndUpdate(updatedReceptionist.userId, {
        name: updatedReceptionist.receptionistName,
        email: updatedReceptionist.email,
        phone: updatedReceptionist.phone,
        gender: updatedReceptionist.gender || "other",
        profileImage: updatedReceptionist.profileImage,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Receptionist updated successfully",
      data: updatedReceptionist,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// Soft Delete Receptionist
exports.softDeleteReceptionist = async (req, res) => {
  try {
    const { id } = req.params;
    const existingReceptionist = await Receptionist.findById(id);

    if (!existingReceptionist || existingReceptionist.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Receptionist not found",
      });
    }

    existingReceptionist.isDeleted = true;
    existingReceptionist.status = "inactive";
    await existingReceptionist.save();

    // Disable the user login account
    if (existingReceptionist.userId) {
      await User.findByIdAndUpdate(existingReceptionist.userId, {
        status: "inactive",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Receptionist soft deleted successfully",
      data: existingReceptionist,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// Restore Receptionist
exports.restoreReceptionist = async (req, res) => {
  try {
    const { id } = req.params;
    const existingReceptionist = await Receptionist.findById(id);

    if (!existingReceptionist) {
      return res.status(404).json({
        success: false,
        message: "Receptionist not found",
      });
    }

    existingReceptionist.isDeleted = false;
    existingReceptionist.status = "active";
    await existingReceptionist.save();

    // Re-enable user login account
    if (existingReceptionist.userId) {
      await User.findByIdAndUpdate(existingReceptionist.userId, {
        status: "active",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Receptionist restored successfully",
      data: existingReceptionist,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// Hard Delete Receptionist
exports.hardDeleteReceptionist = async (req, res) => {
  try {
    const { id } = req.params;
    const existingReceptionist = await Receptionist.findById(id);

    if (!existingReceptionist) {
      return res.status(404).json({
        success: false,
        message: "Receptionist not found",
      });
    }

    // Delete corresponding user record
    if (existingReceptionist.userId) {
      await User.findByIdAndDelete(existingReceptionist.userId);
    }

    await Receptionist.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Receptionist permanently deleted",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};
