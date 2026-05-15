const Doctor = require("../model/doctorModel");
const User = require("../model/userModel");
const Hospital = require("../model/hospitalModel");
const Department = require("../model/departmentModel");
const SubDepartment = require("../model/subDepartmentModel");

const bcrypt = require("bcrypt");

const { v4: uuidv4 } = require("uuid");

const mailSender = require("../utils/mailSender");

const doctorMailTemplate = require("../templates/doctorMailTemplate");
const { uploadImage } = require("../utils/cloudnairy");

const toBoolean = (value) => value === true || value === "true";
const toNumber = (value) => (value === "" || value === undefined ? 0 : Number(value));

const parseJson = (value, fallback) => {
  if (typeof value !== "string") return value || fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const mapUploads = (uploads, files) =>
  uploads.map((item, index) => ({
    url: item.secure_url,
    publicId: item.public_id,
    name: files[index]?.originalname || item.original_filename || "",
    type: item.resource_type,
  }));

// create doctor
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

    const normalizedEmail = email.trim().toLowerCase();

    // check existing doctor
    const alreadyExists = await Doctor.findOne({
      $or: [
        { email: normalizedEmail },
        { doctorCode: doctorCode.trim() },
        { licenseNumber: licenseNumber.trim() },
      ],
    });
    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { phone: phone.trim() }],
    });

    if (alreadyExists || existingUser) {
      return res.status(400).json({
        success: false,
        message: "Doctor account already exists",
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

    const profileUpload = req.files?.profileImage?.[0]
      ? await uploadImage(req.files.profileImage[0], "medicore/doctors/profile")
      : [];
    const fileUploads = req.files?.doctorFiles?.length
      ? await uploadImage(req.files.doctorFiles, "medicore/doctors/files")
      : [];
    const parsedAvailableTime = parseJson(availableTime, {
      startTime: "",
      endTime: "",
    });

    // create doctor
    const newDoctor = await Doctor.create({
      hospitalId,

      departmentId,

      subDepartmentId: subDepartmentId || null,

      doctorName: doctorName.trim(),

      doctorCode: doctorCode.trim(),

      email: normalizedEmail,

      phone: phone.trim(),

      alternatePhone: alternatePhone || "",

      gender: gender || undefined,

      dateOfBirth: dateOfBirth || null,

      specialization: specialization.trim(),

      qualification: qualification.trim(),

      experience: toNumber(experience),

      consultationFee: toNumber(consultationFee),

      licenseNumber: licenseNumber.trim(),

      bloodGroup: bloodGroup || "",

      address: address || "",

      stateId: stateId || null,

      districtId: districtId || null,

      cityId: cityId || null,

      pincode: pincode || "",

      profileImage: profileUpload[0]?.secure_url || "",

      files: mapUploads(fileUploads, req.files?.doctorFiles || []),

      availableDays: parseJson(availableDays, []),

      availableTime: parsedAvailableTime || {
        startTime: "",
        endTime: "",
      },

      emergencyAvailable: toBoolean(emergencyAvailable),

      status: status || "active",
    });

    const newUser = await User.create({
      name: doctorName.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      age: 18,
      gender: gender || "other",
      role: "doctor",
      hospitalId,
      departmentId,
      doctorId: newDoctor._id,
      profileImage: newDoctor.profileImage,
      password: hashedPassword,
    });

    // send mail
    await mailSender(
      normalizedEmail,
      "Doctor Account Created Successfully",
      doctorMailTemplate({
        doctorName,

        email: normalizedEmail,

        password: plainPassword,

        hospitalName: hospital?.hospitalName || "",

        departmentName: department?.departmentName || "",

        subDepartmentName: subDepartment?.subDepartmentName || "",

        specialization,

        qualification,

        experience,

        consultationFee,

        startTime: parsedAvailableTime?.startTime || "",

        endTime: parsedAvailableTime?.endTime || "",
      }),
    );

    return res.status(201).json({
      success: true,
      message: "Doctor created and mail sent successfully",
      data: {
        doctor: newDoctor,
        user: newUser,
      },
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
