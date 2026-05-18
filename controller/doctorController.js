const Doctor = require("../model/doctorModel");
const DoctorImg = require("../model/doctorImgModel");
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

const ensureUploaded = (uploads, files, label) => {
  if (files.length && uploads.length !== files.length) {
    throw new Error(`${label} upload failed`);
  }
};

const duplicateFields = [
  { key: "email", label: "Email" },
  { key: "doctorCode", label: "Doctor code" },
  { key: "licenseNumber", label: "License number" },
];

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
    const normalizedPhone = phone.trim();
    const normalizedDoctorCode = doctorCode.trim();
    const normalizedLicenseNumber = licenseNumber.trim();

    // check existing doctor
    const alreadyExists = await Doctor.findOne({
      $or: [
        { email: normalizedEmail },
        { doctorCode: normalizedDoctorCode },
        { licenseNumber: normalizedLicenseNumber },
      ],
    });
    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { phone: normalizedPhone }],
    });

    if (alreadyExists || existingUser) {
      const duplicate = alreadyExists
        ? duplicateFields.find((field) => {
            const incoming = {
              email: normalizedEmail,
              doctorCode: normalizedDoctorCode,
              licenseNumber: normalizedLicenseNumber,
            }[field.key];

            return alreadyExists[field.key] === incoming;
          })
        : null;

      return res.status(400).json({
        success: false,
        message: duplicate
          ? `${duplicate.label} already exists`
          : existingUser?.email === normalizedEmail
          ? "Email already exists"
          : "Phone already exists",
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
    const subDepartment = subDepartmentId
      ? await SubDepartment.findById(subDepartmentId)
      : null;

    if (!hospital || !department) {
      return res.status(400).json({
        success: false,
        message: !hospital ? "Hospital not found" : "Department not found",
      });
    }

    const profileUpload = req.files?.profileImage?.[0]
      ? await uploadImage(req.files.profileImage[0], "medicore/doctors/profile")
      : [];
    const imageUploads = req.files?.doctorImages?.length
      ? await uploadImage(req.files.doctorImages, "medicore/doctors/images")
      : [];
    const fileUploads = req.files?.doctorFiles?.length
      ? await uploadImage(req.files.doctorFiles, "medicore/doctors/files")
      : [];

    ensureUploaded(profileUpload, req.files?.profileImage || [], "Profile photo");
    ensureUploaded(imageUploads, req.files?.doctorImages || [], "Doctor photo");
    ensureUploaded(fileUploads, req.files?.doctorFiles || [], "Doctor file");

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

      doctorCode: normalizedDoctorCode,

      email: normalizedEmail,

      phone: phone.trim(),

      alternatePhone: alternatePhone || "",

      gender: gender || undefined,

      dateOfBirth: dateOfBirth || null,

      specialization: specialization.trim(),

      qualification: qualification.trim(),

      experience: toNumber(experience),

      consultationFee: toNumber(consultationFee),

      licenseNumber: normalizedLicenseNumber,

      bloodGroup: bloodGroup || "",

      address: address || "",

      stateId: stateId || null,

      districtId: districtId || null,

      cityId: cityId || null,

      pincode: pincode || "",

      profileImage: profileUpload[0]?.secure_url || "",

      doctorImage: null,

      files: [],

      availableDays: parseJson(availableDays, []),

      availableTime: parsedAvailableTime || {
        startTime: "",
        endTime: "",
      },

      emergencyAvailable: toBoolean(emergencyAvailable),

      status: status || "active",
    });

    const doctorImage = profileUpload[0]
      ? await DoctorImg.create({
          doctorId: newDoctor._id,
          profileImage: profileUpload[0].secure_url || "",
          url: profileUpload[0].secure_url || "",
          publicId: profileUpload[0].public_id || "",
          name:
            req.files?.profileImage?.[0]?.originalname ||
            profileUpload[0].original_filename ||
            "",
          type: profileUpload[0].resource_type || "",
          category: "profile",
        })
      : null;
    const doctorFileDocs = fileUploads.length
      ? await DoctorImg.insertMany(
          mapUploads(fileUploads, req.files?.doctorFiles || []).map((file) => ({
            ...file,
            doctorId: newDoctor._id,
            category: "file",
          })),
        )
      : [];
    const doctorImageDocs = imageUploads.length
      ? await DoctorImg.insertMany(
          mapUploads(imageUploads, req.files?.doctorImages || []).map((image) => ({
            ...image,
            doctorId: newDoctor._id,
            category: "image",
          })),
        )
      : [];

    if (doctorImage) {
      newDoctor.doctorImage = doctorImage._id;
    }

    if (doctorImageDocs.length || doctorFileDocs.length) {
      newDoctor.files = [...doctorImageDocs, ...doctorFileDocs].map((file) => file._id);
    }

    if (doctorImage || doctorImageDocs.length || doctorFileDocs.length) {
      await newDoctor.save();
    }

    const newUser = await User.create({
      name: doctorName.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
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
        doctor: await newDoctor.populate([{ path: "doctorImage" }, { path: "files" }]),
        user: newUser,
      },
    });
  } catch (err) {
    console.error("Create doctor failed:", err);
    const statusCode = err.name === "ValidationError" ? 400 : 500;

    return res.status(statusCode).json({
      success: false,
      message: err.message || "Server Error",
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
      .populate("subDepartmentId")
      .populate("doctorImage")
      .populate("files");

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
      .populate("subDepartmentId")
      .populate("doctorImage")
      .populate("files");

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
