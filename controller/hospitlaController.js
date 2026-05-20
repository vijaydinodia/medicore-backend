const hospital = require("../model/hospitalModel");
const HospitalImg = require("../model/hospitalImgModel");
const { uploadImage } = require("../utils/cloudnairy");

// get all hospital
exports.getAllHospital = async (req, res) => {
  try {
    const hospitals = await hospital
      .find({
        isDeleted: false,
        isActive: true,
        status: "approved",
      })
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

// add hospital
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

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();
    const normalizedHospitalCode = hospitalCode.trim();
    const normalizedRegistrationNumber = registrationNumber.trim();

    // check existing hospital
    const alreadyExists = await hospital.findOne({
      $or: [
        { email: normalizedEmail },
        { phone: normalizedPhone },
        { hospitalCode: normalizedHospitalCode },
        { registrationNumber: normalizedRegistrationNumber },
      ],
    });

    if (alreadyExists) {
      return res.status(400).json({
        success: false,
        message: "Hospital already exists",
      });
    }

    let logoUrl = "";
    let imageUploads = [];
    let fileUploads = [];

    // upload logo
    if (req.files && req.files.logo && req.files.logo[0]) {
      const uploadedLogo = await uploadImage(
        req.files.logo[0],
        "medicore/hospitals/logos",
      );

      if (uploadedLogo.length) {
        logoUrl = uploadedLogo[0].secure_url;
      }
    }

    // upload hospital images
    if (req.files && req.files.hospitalImages) {
      imageUploads = await uploadImage(
        req.files.hospitalImages,
        "medicore/hospitals/images",
      );
    }

    // upload hospital files
    if (req.files && req.files.hospitalFiles) {
      fileUploads = await uploadImage(
        req.files.hospitalFiles,
        "medicore/hospitals/files",
      );
    }

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
      establishedYear: establishedYear || undefined,
      stateId,
      districtId,
      cityId,
      address: address.trim(),
      pincode: pincode.trim(),
      totalBeds: totalBeds || 0,
      availableBeds: availableBeds || 0,
      totalDoctors: totalDoctors || 0,
      totalStaff: totalStaff || 0,
      emergencyAvailable:
        emergencyAvailable === true || emergencyAvailable === "true",
      ambulanceAvailable:
        ambulanceAvailable === true || ambulanceAvailable === "true",
      ICUAvailable: ICUAvailable === true || ICUAvailable === "true",
      bloodBankAvailable:
        bloodBankAvailable === true || bloodBankAvailable === "true",
      pharmacyAvailable:
        pharmacyAvailable === true || pharmacyAvailable === "true",
      logo: logoUrl,
      images: [],
      files: [],
      description: description ? description.trim() : "",
    });

    const hospitalImages = [];
    const hospitalFiles = [];
    let parsedDocumentNames = [];

    if (documentNames) {
      try {
        parsedDocumentNames = JSON.parse(documentNames);
      } catch (err) {
        parsedDocumentNames = [];
      }
    }

    // save hospital image records
    if (imageUploads.length) {
      for (let i = 0; i < imageUploads.length; i++) {
        const image = await HospitalImg.create({
          hospitalId: newHospital._id,
          url: imageUploads[i].secure_url,
          publicId: imageUploads[i].public_id,
          name:
            req.files.hospitalImages[i].originalname ||
            imageUploads[i].original_filename ||
            "",
          category: "image",
          type: imageUploads[i].resource_type,
        });

        hospitalImages.push(image._id);
      }
    }

    // save hospital file records
    if (fileUploads.length) {
      for (let i = 0; i < fileUploads.length; i++) {
        const file = await HospitalImg.create({
          hospitalId: newHospital._id,
          url: fileUploads[i].secure_url,
          publicId: fileUploads[i].public_id,
          name:
            req.files.hospitalFiles[i].originalname ||
            fileUploads[i].original_filename ||
            "",
          documentName:
            parsedDocumentNames[i] ||
            req.files.hospitalFiles[i].originalname ||
            `Document ${i + 1}`,
          category: "document",
          type: fileUploads[i].resource_type,
        });

        hospitalFiles.push(file._id);
      }
    }

    newHospital.images = hospitalImages;
    newHospital.files = hospitalFiles;

    await newHospital.save();
    await newHospital.populate("images");
    await newHospital.populate("files");

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
