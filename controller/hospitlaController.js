const hospital = require("../model/hospitalModel");

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
      logo,
      description,
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

      totalBeds: totalBeds || 0,

      availableBeds: availableBeds || 0,

      totalDoctors: totalDoctors || 0,

      totalStaff: totalStaff || 0,

      emergencyAvailable: emergencyAvailable || false,

      ambulanceAvailable: ambulanceAvailable || false,

      ICUAvailable: ICUAvailable || false,

      bloodBankAvailable: bloodBankAvailable || false,

      pharmacyAvailable: pharmacyAvailable || false,

      logo: logo || "",

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

