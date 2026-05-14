const Doctor = require("../model/doctorModel");
const Hospital = require("../model/hospitalModel");
const Department = require("../model/departmentModel");
const SubDepartment = require("../model/subDepartmentModel");

const bcrypt = require("bcrypt");

const { v4: uuidv4 } = require("uuid");

const mailSender = require("../utils/mailSender");

const doctorMailTemplate = require("../templates/doctorMailTemplate");

// CREATE DOCTOR
exports.createDoctor = async (req, res) => {
  try {
    const {
      hospitalId,
      departmentId,
      subDepartmentId,
      doctorName,
      doctorCode,
      email,
      phone,
      alternatePhone,
      gender,
      dateOfBirth,
      specialization,
      qualification,
      experience,
      consultationFee,
      licenseNumber,
      bloodGroup,
      address,
      stateId,
      districtId,
      cityId,
      pincode,
      profileImage,
      availableDays,
      availableTime,
      emergencyAvailable,
      status,
    } = req.body;

    // validation
    if (
      !(
        hospitalId &&
        departmentId &&
        doctorName &&
        doctorCode &&
        email &&
        phone &&
        specialization &&
        qualification &&
        licenseNumber
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing",
      });
    }

    // check existing doctor
    const alreadyExists = await Doctor.findOne({
      $or: [
        { email: email.trim().toLowerCase() },
        { doctorCode: doctorCode.trim() },
        { licenseNumber: licenseNumber.trim() },
      ],
    });

    if (alreadyExists) {
      return res.status(400).json({
        success: false,
        message: "Doctor already exists",
      });
    }

    // generate random password
    const plainPassword = uuidv4().replace(/-/g, "").slice(0, 8);

    // hash password
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // get hospital
    const hospital = await Hospital.findById(hospitalId);

    // get department
    const department = await Department.findById(departmentId);

    // get sub department
    const subDepartment = await SubDepartment.findById(subDepartmentId);

    // create doctor
    const newDoctor = await Doctor.create({
      hospitalId,

      departmentId,

      subDepartmentId: subDepartmentId || null,

      doctorName: doctorName.trim(),

      doctorCode: doctorCode.trim(),

      email: email.trim().toLowerCase(),

      phone: phone.trim(),

      alternatePhone: alternatePhone || "",

      gender: gender || "",

      dateOfBirth: dateOfBirth || null,

      specialization: specialization.trim(),

      qualification: qualification.trim(),

      experience: experience || 0,

      consultationFee: consultationFee || 0,

      licenseNumber: licenseNumber.trim(),

      bloodGroup: bloodGroup || "",

      address: address || "",

      stateId: stateId || null,

      districtId: districtId || null,

      cityId: cityId || null,

      pincode: pincode || "",

      profileImage: profileImage || "",

      availableDays: availableDays || [],

      availableTime: availableTime || {
        startTime: "",
        endTime: "",
      },

      emergencyAvailable: emergencyAvailable || false,

      status: status || "active",

      password: hashedPassword,
    });

    // send mail
    await mailSender(
      email,
      "Doctor Account Created Successfully",
      doctorMailTemplate({
        doctorName,

        email,

        password: plainPassword,

        hospitalName: hospital?.hospitalName || "",

        departmentName: department?.departmentName || "",

        subDepartmentName: subDepartment?.subDepartmentName || "",

        specialization,

        qualification,

        experience,

        consultationFee,

        startTime: availableTime?.startTime || "",

        endTime: availableTime?.endTime || "",
      }),
    );

    return res.status(201).json({
      success: true,
      message: "Doctor created and mail sent successfully",
      data: newDoctor,
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};
// get all
exports.getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find()
      .populate("hospitalId")
      .populate("departmentId")
      .populate("subDepartmentId");

    return res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors,
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// get one
exports.getSingleDoctor = async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await Doctor.findById(id)
      .populate("hospitalId")
      .populate("departmentId")
      .populate("subDepartmentId");

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: doctor,
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// update
exports.updateDoctor = async (req, res) => {
  try {
    const { id } = req.params;

    const existingDoctor = await Doctor.findById(id);

    if (!existingDoctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    const updatedDoctor = await Doctor.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    return res.status(200).json({
      success: true,
      message: "Doctor updated successfully",
      data: updatedDoctor,
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// soft delete
exports.softDeleteDoctor = async (req, res) => {
  try {
    const { id } = req.params;

    const existingDoctor = await Doctor.findById(id);

    if (!existingDoctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    existingDoctor.status = "inactive";

    await existingDoctor.save();

    return res.status(200).json({
      success: true,
      message: "Doctor soft deleted successfully",
      data: existingDoctor,
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// restore
exports.restoreDoctor = async (req, res) => {
  try {
    const { id } = req.params;

    const existingDoctor = await Doctor.findById(id);

    if (!existingDoctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    existingDoctor.status = "inactive";

    await existingDoctor.save();

    return res.status(200).json({
      success: true,
      message: "Doctor restored successfully",
      data: existingDoctor,
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// hard delete
exports.hardDeleteDoctor = async (req, res) => {
  try {
    const { id } = req.params;

    const existingDoctor = await Doctor.findById(id);

    if (!existingDoctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    await Doctor.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Doctor deleted permanently",
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};
