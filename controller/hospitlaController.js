const hospital = require("../model/hospitalModel");
const { uploadImage } = require("../utils/cloudnairy");

const toBoolean = (value) => value === true || value === "true";
const toNumber = (value) => (value === "" || value === undefined ? undefined : Number(value));

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
    documentName: documentNames[index]?.trim() || files[index]?.originalname || item.original_filename || "",
    type: item.resource_type,
  }));

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
    const alreadyExists = await hospital.findOne({
      $or: [{ email }, { phone }, { hospitalCode }, { registrationNumber }],
    });

    if (alreadyExists) {
      return res.status(400).json({
        success: false,
        message: "Hospital already exists",
      });
    }

    const parsedDocumentNames = parseDocumentNames(documentNames);
    const documentFiles = req.files?.hospitalFiles || [];

    if (!documentFiles.length) {
      return res.status(400).json({
        success: false,
        message: "At least one required document must be uploaded",
      });
    }

    if (parsedDocumentNames.length !== documentFiles.length || parsedDocumentNames.some((name) => !name?.trim())) {
      return res.status(400).json({
        success: false,
        message: "Each uploaded document needs a document name",
      });
    }

    const logoUpload = req.files?.logo?.[0]
      ? await uploadImage(req.files.logo[0], "medicore/hospitals/logos")
      : [];
    const imageUploads = req.files?.hospitalImages?.length
      ? await uploadImage(req.files.hospitalImages, "medicore/hospitals/images")
      : [];
    const fileUploads = documentFiles.length
      ? await uploadImage(documentFiles, "medicore/hospitals/files")
      : [];

    // create hospital
    const newHospital = await hospital.create({
      hospitalName: hospitalName.trim(),

      hospitalCode: hospitalCode.trim(),

      hospitalType,

      email: email.trim().toLowerCase(),

      phone: phone.trim(),

      alternatePhone: alternatePhone ? alternatePhone.trim() : "",

      website: website ? website.trim() : "",

      registrationNumber: registrationNumber.trim(),

      establishedYear,

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

      images: mapUploads(imageUploads, req.files?.hospitalImages || []),

      files: mapUploads(fileUploads, documentFiles, parsedDocumentNames),

      description: description ? description.trim() : "",
    });

    // response
    return res.status(201).json({
      success: true,
      message: "Hospital added successfully",
      data: newHospital,
    });
  } catch (err) {
    return res.status(500).json({
      success: false, 
      message: "Server Error",
      error: err.message,
    });
  }
};

