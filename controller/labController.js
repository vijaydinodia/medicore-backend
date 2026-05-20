const Lab = require("../model/labModel");
const User = require("../model/userModel");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const mailSender = require("../utils/mailSender");
const labMailTemplate = require("../templates/labMailTemplate");

// create lab
exports.createLab = async (req, res) => {
  try {
    const {
      cityId,
      labName,
      labCode,
      email,
      phone,
      alternatePhone,
      address,
      pincode,
      inChargeName,
      totalStaff,
      openingTime,
      closingTime,
      emergencyAvailable,
      homeCollectionAvailable,
      logo,
      description,
      status,
    } = req.body;

    // validation
    if (req.user.role !== "hospital" && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only hospital can create lab",
      });
    }

    const loginUser = await User.findById(req.user._id || req.user.id);

    if (!loginUser || !loginUser.hospitalId) {
      return res.status(400).json({
        success: false,
        message: "Hospital id is missing for this account",
      });
    }

    const hospitalId = loginUser.hospitalId;

    if (!(cityId && labName && labCode && email && phone)) {
      return res.status(400).json({
        success: false,
        message:
          "City Id, Lab Name, Lab Code, Email and Phone are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();

    // check existing lab
    const alreadyExists = await Lab.findOne({
      $or: [
        { labCode: labCode.trim() },
        { labName: labName.trim(), hospitalId },
        { email: normalizedEmail },
        { phone: normalizedPhone },
      ],
    });

    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { phone: normalizedPhone }],
    });

    if (alreadyExists || existingUser) {
      return res.status(400).json({
        success: false,
        message: "Lab already exists",
      });
    }

    // generate random password
    const plainPassword = uuidv4().replace(/-/g, "").slice(0, 8);

    // hash password
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // create lab login account
    const newUser = await User.create({
      name: labName.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      age: 18,
      gender: "other",
      role: "lab",
      hospitalId,
      password: hashedPassword,
    });

    // create lab
    const newLab = await Lab.create({
      hospitalId,
      cityId,
      userId: newUser._id,
      labName: labName.trim(),
      labCode: labCode.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      alternatePhone: alternatePhone ? alternatePhone.trim() : "",
      address: address ? address.trim() : "",
      pincode: pincode ? pincode.trim() : "",
      inChargeName: inChargeName ? inChargeName.trim() : "",
      totalStaff: totalStaff || 0,
      openingTime: openingTime || "",
      closingTime: closingTime || "",
      emergencyAvailable: emergencyAvailable || false,
      homeCollectionAvailable: homeCollectionAvailable || false,
      logo: logo || "",
      description: description ? description.trim() : "",
      status: status || "active",
    });

    newUser.labId = newLab._id;
    await newUser.save();

    // send mail
    await mailSender(
      normalizedEmail,
      "Lab Account Created Successfully",
      labMailTemplate({
        labName: labName.trim(),
        email: normalizedEmail,
        password: plainPassword,
        labCode: labCode.trim(),
        inChargeName,
      }),
    );

    return res.status(201).json({
      success: true,
      message: "Lab created and mail sent successfully",
      data: {
        lab: newLab,
        user: newUser,
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

// get all labs
exports.getAllLabs = async (req, res) => {
  try {
    const filter = { isDeleted: false };

    if (req.user.role === "hospital") {
      const loginUser = await User.findById(req.user._id || req.user.id);
      if (loginUser && loginUser.hospitalId) {
        filter.hospitalId = loginUser.hospitalId;
      }
    }

    if (req.user.role === "lab") {
      const loginUser = await User.findById(req.user._id || req.user.id);
      if (loginUser && loginUser.labId) {
        filter._id = loginUser.labId;
      }
    }

    const labs = await Lab.find(filter)
      .populate("hospitalId")
      .populate("cityId")
      .populate("userId");

    return res.status(200).json({
      success: true,
      message: "Labs fetched successfully",
      count: labs.length,
      data: labs,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// get one lab
exports.getOneLab = async (req, res) => {
  try {
    const { id } = req.params;

    const lab = await Lab.findOne({ _id: id, isDeleted: false })
      .populate("hospitalId")
      .populate("cityId")
      .populate("userId");

    if (!lab) {
      return res.status(404).json({
        success: false,
        message: "Lab not found",
      });
    }

    if (req.user.role === "lab") {
      const loginUser = await User.findById(req.user._id || req.user.id);

      if (!loginUser || String(loginUser.labId) !== String(lab._id)) {
        return res.status(403).json({
          success: false,
          message: "You are not allowed to view this lab",
        });
      }
    }

    if (req.user.role === "hospital") {
      const loginUser = await User.findById(req.user._id || req.user.id);

      if (!loginUser || String(loginUser.hospitalId) !== String(lab.hospitalId?._id || lab.hospitalId)) {
        return res.status(403).json({
          success: false,
          message: "You are not allowed to view this lab",
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Lab fetched successfully",
      data: lab,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// get single lab
exports.getSingleLab = async (req, res) => {
  try {
    const { id } = req.params;

    const lab = await Lab.findOne({ _id: id, isDeleted: false })
      .populate("hospitalId")
      .populate("cityId")
      .populate("userId");

    if (!lab) {
      return res.status(404).json({
        success: false,
        message: "Lab not found",
      });
    }

    if (req.user.role === "lab") {
      const loginUser = await User.findById(req.user._id || req.user.id);

      if (!loginUser || String(loginUser.labId) !== String(lab._id)) {
        return res.status(403).json({
          success: false,
          message: "You are not allowed to view this lab",
        });
      }
    }

    if (req.user.role === "hospital") {
      const loginUser = await User.findById(req.user._id || req.user.id);

      if (!loginUser || String(loginUser.hospitalId) !== String(lab.hospitalId?._id || lab.hospitalId)) {
        return res.status(403).json({
          success: false,
          message: "You are not allowed to view this lab",
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Lab fetched successfully",
      data: lab,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// update lab
exports.updateLab = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      hospitalId,
      cityId,
      labName,
      labCode,
      email,
      phone,
      alternatePhone,
      address,
      pincode,
      inChargeName,
      totalStaff,
      openingTime,
      closingTime,
      emergencyAvailable,
      homeCollectionAvailable,
      logo,
      description,
      status,
    } = req.body;

    // check lab exists
    const existingLab = await Lab.findById(id);

    if (!existingLab) {
      return res.status(404).json({
        success: false,
        message: "Lab not found",
      });
    }

    // check duplicate lab code
    if (labCode) {
      const duplicateLab = await Lab.findOne({
        labCode: labCode.trim(),
        _id: { $ne: id },
      });

      if (duplicateLab) {
        return res.status(400).json({
          success: false,
          message: "Lab code already exists",
        });
      }
    }

    // update lab
    const updatedLab = await Lab.findByIdAndUpdate(
      id,
      {
        hospitalId: hospitalId || existingLab.hospitalId,
        cityId: cityId || existingLab.cityId,
        labName: labName ? labName.trim() : existingLab.labName,
        labCode: labCode ? labCode.trim() : existingLab.labCode,
        email: email ? email.trim().toLowerCase() : existingLab.email,
        phone: phone ? phone.trim() : existingLab.phone,
        alternatePhone:
          alternatePhone !== undefined
            ? alternatePhone.trim()
            : existingLab.alternatePhone,
        address: address !== undefined ? address.trim() : existingLab.address,
        pincode: pincode !== undefined ? pincode.trim() : existingLab.pincode,
        inChargeName:
          inChargeName !== undefined
            ? inChargeName.trim()
            : existingLab.inChargeName,
        totalStaff:
          totalStaff !== undefined ? totalStaff : existingLab.totalStaff,
        openingTime:
          openingTime !== undefined ? openingTime : existingLab.openingTime,
        closingTime:
          closingTime !== undefined ? closingTime : existingLab.closingTime,
        emergencyAvailable:
          emergencyAvailable !== undefined
            ? emergencyAvailable
            : existingLab.emergencyAvailable,
        homeCollectionAvailable:
          homeCollectionAvailable !== undefined
            ? homeCollectionAvailable
            : existingLab.homeCollectionAvailable,
        logo: logo !== undefined ? logo : existingLab.logo,
        description:
          description !== undefined
            ? description.trim()
            : existingLab.description,
        status: status || existingLab.status,
      },
      {
        new: true,
      },
    );

    return res.status(200).json({
      success: true,
      message: "Lab updated successfully",
      data: updatedLab,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// delete lab
exports.deleteLab = async (req, res) => {
  try {
    const { id } = req.params;

    const existingLab = await Lab.findById(id);

    if (!existingLab) {
      return res.status(404).json({
        success: false,
        message: "Lab not found",
      });
    }

    await Lab.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Lab deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// soft delete lab
exports.softDeleteLab = async (req, res) => {
  try {
    const { id } = req.params;

    const existingLab = await Lab.findById(id);

    if (!existingLab) {
      return res.status(404).json({
        success: false,
        message: "Lab not found",
      });
    }

    // soft delete
    existingLab.isDeleted = true;
    existingLab.status = "inactive";

    await existingLab.save();

    return res.status(200).json({
      success: true,
      message: "Lab soft deleted successfully",
      data: existingLab,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// restore lab
exports.restoreLab = async (req, res) => {
  try {
    const { id } = req.params;

    const existingLab = await Lab.findById(id);

    if (!existingLab) {
      return res.status(404).json({
        success: false,
        message: "Lab not found",
      });
    }

    // restore lab
    existingLab.isDeleted = false;
    existingLab.status = "active";

    await existingLab.save();

    return res.status(200).json({
      success: true,
      message: "Lab restored successfully",
      data: existingLab,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// hard delete lab
exports.hardDeleteLab = async (req, res) => {
  try {
    const { id } = req.params;

    const existingLab = await Lab.findById(id);

    if (!existingLab) {
      return res.status(404).json({
        success: false,
        message: "Lab not found",
      });
    }

    // hard delete
    await Lab.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Lab deleted permanently",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};
