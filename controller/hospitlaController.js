const hospital = require("../model/hospitalModel");
const HospitalImg = require("../model/hospitalImgModel");
const { uploadImage } = require("../utils/cloudnairy");

const toBoolean = (value) => value === true || value === "true";
const toNumber = (value) =>
  value === "" || value === undefined ? undefined : Number(value);

const parseDocumentNames = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const mapUploads = (uploads, files, documentNames = []) =>
  uploads.map((item, index) => ({
    url: item.secure_url,
    publicId: item.public_id,
    name: files[index]?.originalname || item.original_filename || "",
    documentName:
      documentNames[index]?.trim() ||
      files[index]?.originalname ||
      item.original_filename ||
      "",
    type: item.resource_type,
  }));

const mapImageUploads = (uploads, files) =>
  uploads.map((item, index) => ({
    url: item.secure_url,
    publicId: item.public_id,
    name: files[index]?.originalname || item.original_filename || "",
    category: "image",
    type: item.resource_type,
  }));

const getDocumentNames = (documentNames, files) => {
  const parsedDocumentNames = parseDocumentNames(documentNames);

  return files.map((file, index) => {
    const documentName = parsedDocumentNames[index];
    return documentName?.trim() || file.originalname || `Document ${index + 1}`;
  });
};

const ensureUploaded = (uploads, files, label) => {
  if (files.length && uploads.length !== files.length) {
    throw new Error(`${label} upload failed`);
  }
};

const duplicateFields = [
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "hospitalCode", label: "Hospital code" },
  { key: "registrationNumber", label: "Registration number" },
];

exports.getAllHospital = async (req, res) => {
  try {
    const hospitals = await hospital
      .find({ isDeleted: false, isActive: true, status: "approved" })
      .populate("images")
      .populate("files")
      .sort({ hospitalName: 1 });

    return res.status(200).json({
      success: true,
      count: hospitals.length,
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

exports.addHospital = async (req, res) => {
  try {
    const {
      hospitalName,
      hospitalCode,
      hospitalType,
      email,
      phone,
      alternatePhone,
      website,
      registrationNumber,
      establishedYear,
      stateId,
      districtId,
      cityId,
      address,
      pincode,
      totalBeds,
      availableBeds,
      totalDoctors,
      totalStaff,
      emergencyAvailable,
      ambulanceAvailable,
      ICUAvailable,
      bloodBankAvailable,
      pharmacyAvailable,
      description,
      documentNames,
    } = req.body;

    // validation
    if (
      !(
        hospitalName &&
        hospitalCode &&
        hospitalType &&
        email &&
        phone &&
        registrationNumber &&
        stateId &&
        districtId &&
        cityId &&
        address &&
        pincode
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing",
      });
    }

    // check existing hospital
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();
    const normalizedHospitalCode = hospitalCode.trim();
    const normalizedRegistrationNumber = registrationNumber.trim();

    const alreadyExists = await hospital.findOne({
      $or: [
        { email: normalizedEmail },
        { phone: normalizedPhone },
        { hospitalCode: normalizedHospitalCode },
        { registrationNumber: normalizedRegistrationNumber },
      ],
    });

    if (alreadyExists) {
      const duplicate = duplicateFields.find((field) => {
        const incoming = {
          email: normalizedEmail,
          phone: normalizedPhone,
          hospitalCode: normalizedHospitalCode,
          registrationNumber: normalizedRegistrationNumber,
        }[field.key];

        return alreadyExists[field.key] === incoming;
      });

      return res.status(400).json({
        success: false,
        message: duplicate
          ? `${duplicate.label} already exists`
          : "Hospital already exists",
      });
    }

    const documentFiles = req.files?.hospitalFiles || [];
    const parsedDocumentNames = getDocumentNames(documentNames, documentFiles);

    const logoUpload = req.files?.logo?.[0]
      ? await uploadImage(req.files.logo[0], "medicore/hospitals/logos")
      : [];
    const imageUploads = req.files?.hospitalImages?.length
      ? await uploadImage(req.files.hospitalImages, "medicore/hospitals/images")
      : [];
    const fileUploads = documentFiles.length
      ? await uploadImage(documentFiles, "medicore/hospitals/files")
      : [];

    ensureUploaded(logoUpload, req.files?.logo || [], "Logo");
    ensureUploaded(imageUploads, req.files?.hospitalImages || [], "Hospital image");
    ensureUploaded(fileUploads, documentFiles, "Document");

    // create hospital
    const newHospital = await hospital.create({
      hospitalName: hospitalName.trim(),

      hospitalCode: normalizedHospitalCode,

      hospitalType,

      email: normalizedEmail,

      phone: normalizedPhone,

      alternatePhone: alternatePhone ? alternatePhone.trim() : "",

      website: website ? website.trim() : "",

      registrationNumber: normalizedRegistrationNumber,

      establishedYear: toNumber(establishedYear),

      stateId,
      districtId,
      cityId,

      address: address.trim(),

      pincode: pincode.trim(),

      totalBeds: toNumber(totalBeds) || 0,

      availableBeds: toNumber(availableBeds) || 0,

      totalDoctors: toNumber(totalDoctors) || 0,

      totalStaff: toNumber(totalStaff) || 0,

      emergencyAvailable: toBoolean(emergencyAvailable),

      ambulanceAvailable: toBoolean(ambulanceAvailable),

      ICUAvailable: toBoolean(ICUAvailable),

      bloodBankAvailable: toBoolean(bloodBankAvailable),

      pharmacyAvailable: toBoolean(pharmacyAvailable),

      logo: logoUpload[0]?.secure_url || "",

      images: [],

      files: [],

      description: description ? description.trim() : "",
    });

    const hospitalImageDocs = imageUploads.length
      ? await HospitalImg.insertMany(
          mapImageUploads(imageUploads, req.files?.hospitalImages || []).map(
            (image) => ({
              ...image,
              hospitalId: newHospital._id,
            }),
          ),
        )
      : [];
    const hospitalFileDocs = fileUploads.length
      ? await HospitalImg.insertMany(
          mapUploads(fileUploads, documentFiles, parsedDocumentNames).map(
            (file) => ({
              ...file,
              category: "document",
              hospitalId: newHospital._id,
            }),
          ),
        )
      : [];

    if (hospitalImageDocs.length || hospitalFileDocs.length) {
      newHospital.images = hospitalImageDocs.map((image) => image._id);
      newHospital.files = hospitalFileDocs.map((file) => file._id);
      await newHospital.save();
    }

    await newHospital.populate([{ path: "images" }, { path: "files" }]);

    // response
    return res.status(201).json({
      success: true,
      message: "Hospital added successfully",
      data: newHospital,
    });
  } catch (err) {
    console.error("Add hospital failed:", err);
    const statusCode = err.name === "ValidationError" ? 400 : 500;

    return res.status(statusCode).json({
      success: false,
      message: err.message || "Server Error",
      error: err.message,
    });
  }
};
