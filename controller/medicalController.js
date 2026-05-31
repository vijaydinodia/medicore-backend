const Medical = require("../model/medicalModel");
const MedicalOrder = require("../model/medicalOrderModel");
const MedicalStore = require("../model/medicalStoreModel");
const Hospital = require("../model/hospitalModel");
const User = require("../model/userModel");
const City = require("../model/cityModel");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const mailSender = require("../utils/mailSender");
const medicalMailTemplate = require("../templates/medicalMailTemplate");

// get hospital id from login account

const getHospitalId = async (req) => {
  if (!["hospital", "admin", "medical"].includes(req.user.role)) {
    return null;
  }

  const loginUser = await User.findById(req.user._id || req.user.id);

  if (!loginUser || !loginUser.hospitalId) {
    return null;
  }

  return loginUser.hospitalId;
};

const getLoginUser = (req) => User.findById(req.user._id || req.user.id);

const getMedicalStoreId = async (req) => {
  if (req.user.role !== "medical") {
    return null;
  }

  const loginUser = await getLoginUser(req);

  return loginUser?.medicalStoreId || null;
};

// create medical store account
exports.createMedicalStore = async (req, res) => {
  try {
    if (req.user.role !== "hospital" && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only hospital can create medical store",
      });
    }

    const loginUser = await getLoginUser(req);

    if (!loginUser || !loginUser.hospitalId) {
      return res.status(400).json({
        success: false,
        message: "Hospital id is missing for this account",
      });
    }

    const {
      cityId,
      medicalName,
      medicalCode,
      email,
      phone,
      alternatePhone,
      address,
      pincode,
      inChargeName,
      licenseNumber,
      openingTime,
      closingTime,
      deliveryAvailable,
      emergencyAvailable,
      description,
      status,
    } = req.body;

    if (!(cityId && medicalName && medicalCode && email && phone)) {
      return res.status(400).json({
        success: false,
        message: "City, Medical Name, Medical Code, Email and Phone are required",
      });
    }

    const hospitalId = loginUser.hospitalId;
    const [hospital, city] = await Promise.all([
      Hospital.findById(hospitalId),
      City.findById(cityId).populate({
        path: "districtId",
        populate: { path: "stateId" },
      }),
    ]);

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found",
      });
    }

    if (hospital.isDeleted || hospital.isActive === false || hospital.status !== "approved") {
      return res.status(400).json({
        success: false,
        message: "Cannot add medical because this hospital is inactive or not approved",
      });
    }

    if (!city || city.status !== "active" || city.districtId?.status !== "active" || city.districtId?.stateId?.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Cannot add medical in an inactive city, district, or state",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();
    const normalizedCode = medicalCode.trim();

    const alreadyExists = await MedicalStore.findOne({
      $or: [
        { medicalCode: normalizedCode },
        { medicalName: medicalName.trim(), hospitalId },
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
        message: "Medical store already exists",
      });
    }

    const plainPassword = uuidv4().replace(/-/g, "").slice(0, 8);
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const newUser = await User.create({
      name: medicalName.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      age: 18,
      gender: "other",
      role: "medical",
      hospitalId,
      password: hashedPassword,
    });

    const newMedicalStore = await MedicalStore.create({
      hospitalId,
      cityId,
      userId: newUser._id,
      medicalName: medicalName.trim(),
      medicalCode: normalizedCode,
      email: normalizedEmail,
      phone: normalizedPhone,
      alternatePhone: alternatePhone ? alternatePhone.trim() : "",
      address: address ? address.trim() : "",
      pincode: pincode ? pincode.trim() : "",
      inChargeName: inChargeName ? inChargeName.trim() : "",
      licenseNumber: licenseNumber ? licenseNumber.trim() : "",
      openingTime: openingTime || "",
      closingTime: closingTime || "",
      deliveryAvailable: deliveryAvailable === true || deliveryAvailable === "true",
      emergencyAvailable: emergencyAvailable === true || emergencyAvailable === "true",
      description: description ? description.trim() : "",
      status: status || "active",
    });

    newUser.medicalStoreId = newMedicalStore._id;
    await newUser.save();

    await mailSender(
      normalizedEmail,
      "Medical Account Created Successfully",
      medicalMailTemplate({
        medicalName: newMedicalStore.medicalName,
        medicalCode: newMedicalStore.medicalCode,
        email: normalizedEmail,
        password: plainPassword,
        hospitalName: hospital.hospitalName,
        inChargeName: newMedicalStore.inChargeName,
        licenseNumber: newMedicalStore.licenseNumber,
        openingTime: newMedicalStore.openingTime,
        closingTime: newMedicalStore.closingTime,
      }),
    );

    return res.status(201).json({
      success: true,
      message: "Medical store created and mail sent successfully",
      data: {
        medicalStore: newMedicalStore,
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

// get medical stores
exports.getAllMedicalStores = async (req, res) => {
  try {
    const filter = { isDeleted: false };

    if (req.user.role === "hospital" || req.user.role === "admin") {
      const hospitalId = await getHospitalId(req);
      if (hospitalId) filter.hospitalId = hospitalId;
    }

    if (req.user.role === "medical") {
      const medicalStoreId = await getMedicalStoreId(req);
      if (medicalStoreId) filter._id = medicalStoreId;
    }

    const medicalStores = await MedicalStore.find(filter)
      .populate("hospitalId")
      .populate("cityId")
      .populate("userId", "-password -otp -otpExpire")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Medical stores fetched successfully",
      count: medicalStores.length,
      data: medicalStores,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// create medical
exports.createMedical = async (req, res) => {
  try {
    const hospitalId = await getHospitalId(req);
    const medicalStoreId = await getMedicalStoreId(req);
    const {
      medicineName,
      medicineCode,
      category,
      manufacturer,
      stock,
      price,
      expiryDate,
      description,
      status,
    } = req.body;

    if (!hospitalId || (req.user.role === "medical" && !medicalStoreId)) {
      return res.status(403).json({
        success: false,
        message: "Only hospital or medical can add medicine",
      });
    }

    if (!(medicineName && medicineCode)) {
      return res.status(400).json({
        success: false,
        message: "Medicine Name and Medicine Code are required",
      });
    }

    const hospital = await Hospital.findById(hospitalId);

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found",
      });
    }

    if (
      hospital.isDeleted ||
      hospital.isActive === false ||
      hospital.status !== "approved"
    ) {
      return res.status(400).json({
        success: false,
        message: "Cannot add medical because hospital is inactive",
      });
    }

    const alreadyExists = await Medical.findOne({
      hospitalId,
      $or: [
        { medicineName: medicineName.trim() },
        { medicineCode: medicineCode.trim() },
      ],
    });

    if (alreadyExists) {
      return res.status(400).json({
        success: false,
        message: "Medical already exists",
      });
    }

    const newMedical = await Medical.create({
      hospitalId,
      medicalStoreId,
      medicineName: medicineName.trim(),
      medicineCode: medicineCode.trim(),
      category: category ? category.trim() : "",
      manufacturer: manufacturer ? manufacturer.trim() : "",
      stock: stock || 0,
      price: price || 0,
      expiryDate: expiryDate || null,
      description: description ? description.trim() : "",
      status: status || "active",
    });

    return res.status(201).json({
      success: true,
      message: "Medical created successfully",
      data: newMedical,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// get all medicals
exports.getAllMedicals = async (req, res) => {
  try {
    const hospitalId = await getHospitalId(req);
    const medicalStoreId = await getMedicalStoreId(req);
    const includeDeleted = req.query.includeDeleted === "true" && hospitalId;
    const filter = includeDeleted ? {} : { isDeleted: false };

    if (hospitalId) {
      filter.hospitalId = hospitalId;
      if (medicalStoreId) {
        filter.medicalStoreId = medicalStoreId;
      }
    } else {
      filter.status = "active";
      filter.stock = { $gt: 0 };
    }

    const medicals = await Medical.find(filter)
      .populate("hospitalId")
      .populate("medicalStoreId")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Medicals fetched successfully",
      count: medicals.length,
      data: medicals,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// get single medical
exports.getSingleMedical = async (req, res) => {
  try {
    const { id } = req.params;
    const medical = await Medical.findOne({ _id: id, isDeleted: false }).populate(
      "hospitalId",
    );

    if (!medical) {
      return res.status(404).json({
        success: false,
        message: "Medical not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: medical,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// update medical
exports.updateMedical = async (req, res) => {
  try {
    const { id } = req.params;
    const hospitalId = await getHospitalId(req);
    const medicalStoreId = await getMedicalStoreId(req);
    const {
      medicineName,
      medicineCode,
      category,
      manufacturer,
      stock,
      price,
      expiryDate,
      description,
      status,
    } = req.body;

    if (!hospitalId || (req.user.role === "medical" && !medicalStoreId)) {
      return res.status(403).json({
        success: false,
        message: "Only hospital or medical can update medicine",
      });
    }

    const existingMedicalFilter = { _id: id, hospitalId };
    if (medicalStoreId) existingMedicalFilter.medicalStoreId = medicalStoreId;

    const existingMedical = await Medical.findOne(existingMedicalFilter);

    if (!existingMedical) {
      return res.status(404).json({
        success: false,
        message: "Medical not found",
      });
    }

    if (medicineCode) {
      const duplicateMedical = await Medical.findOne({
        hospitalId,
        medicineCode: medicineCode.trim(),
        _id: { $ne: id },
      });

      if (duplicateMedical) {
        return res.status(400).json({
          success: false,
          message: "Medicine code already exists",
        });
      }
    }

    const updatedMedical = await Medical.findByIdAndUpdate(
      id,
      {
        medicineName: medicineName
          ? medicineName.trim()
          : existingMedical.medicineName,
        medicineCode: medicineCode
          ? medicineCode.trim()
          : existingMedical.medicineCode,
        category:
          category !== undefined ? category.trim() : existingMedical.category,
        manufacturer:
          manufacturer !== undefined
            ? manufacturer.trim()
            : existingMedical.manufacturer,
        stock: stock !== undefined ? stock : existingMedical.stock,
        price: price !== undefined ? price : existingMedical.price,
        expiryDate:
          expiryDate !== undefined ? expiryDate || null : existingMedical.expiryDate,
        description:
          description !== undefined
            ? description.trim()
            : existingMedical.description,
        status: status || existingMedical.status,
      },
      { new: true, runValidators: true },
    );

    return res.status(200).json({
      success: true,
      message: "Medical updated successfully",
      data: updatedMedical,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// delete medical
exports.deleteMedical = async (req, res) => {
  try {
    const { id } = req.params;
    const hospitalId = await getHospitalId(req);
    const medicalStoreId = await getMedicalStoreId(req);

    if (!hospitalId || (req.user.role === "medical" && !medicalStoreId)) {
      return res.status(403).json({
        success: false,
        message: "Only hospital or medical can delete medicine",
      });
    }

    const existingMedicalFilter = { _id: id, hospitalId };
    if (medicalStoreId) existingMedicalFilter.medicalStoreId = medicalStoreId;

    const existingMedical = await Medical.findOne(existingMedicalFilter);

    if (!existingMedical) {
      return res.status(404).json({
        success: false,
        message: "Medical not found",
      });
    }

    await Medical.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Medical deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// soft delete medical
exports.softDeleteMedical = async (req, res) => {
  try {
    const { id } = req.params;
    const hospitalId = await getHospitalId(req);
    const medicalStoreId = await getMedicalStoreId(req);

    if (!hospitalId || (req.user.role === "medical" && !medicalStoreId)) {
      return res.status(403).json({
        success: false,
        message: "Only hospital or medical can delete medicine",
      });
    }

    const existingMedicalFilter = { _id: id, hospitalId };
    if (medicalStoreId) existingMedicalFilter.medicalStoreId = medicalStoreId;

    const existingMedical = await Medical.findOne(existingMedicalFilter);

    if (!existingMedical) {
      return res.status(404).json({
        success: false,
        message: "Medical not found",
      });
    }

    existingMedical.isDeleted = true;
    existingMedical.status = "inactive";
    await existingMedical.save();

    return res.status(200).json({
      success: true,
      message: "Medical soft deleted successfully",
      data: existingMedical,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// restore medical
exports.restoreMedical = async (req, res) => {
  try {
    const { id } = req.params;
    const hospitalId = await getHospitalId(req);
    const medicalStoreId = await getMedicalStoreId(req);

    if (!hospitalId || (req.user.role === "medical" && !medicalStoreId)) {
      return res.status(403).json({
        success: false,
        message: "Only hospital or medical can restore medicine",
      });
    }

    const existingMedicalFilter = { _id: id, hospitalId };
    if (medicalStoreId) existingMedicalFilter.medicalStoreId = medicalStoreId;

    const existingMedical = await Medical.findOne(existingMedicalFilter);

    if (!existingMedical) {
      return res.status(404).json({
        success: false,
        message: "Medical not found",
      });
    }

    existingMedical.isDeleted = false;
    existingMedical.status = "active";
    await existingMedical.save();

    return res.status(200).json({
      success: true,
      message: "Medical restored successfully",
      data: existingMedical,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// hard delete medical
exports.hardDeleteMedical = async (req, res) => {
  try {
    const { id } = req.params;
    const hospitalId = await getHospitalId(req);
    const medicalStoreId = await getMedicalStoreId(req);

    if (!hospitalId || (req.user.role === "medical" && !medicalStoreId)) {
      return res.status(403).json({
        success: false,
        message: "Only hospital or medical can delete medicine",
      });
    }

    const existingMedicalFilter = { _id: id, hospitalId };
    if (medicalStoreId) existingMedicalFilter.medicalStoreId = medicalStoreId;

    const existingMedical = await Medical.findOne(existingMedicalFilter);

    if (!existingMedical) {
      return res.status(404).json({
        success: false,
        message: "Medical not found",
      });
    }

    await Medical.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Medical deleted permanently",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// user buy medical
exports.buyMedical = async (req, res) => {
  try {
    const { id } = req.params;
    const quantity = Number(req.body.quantity);
    const userId = req.user._id || req.user.id;

    if (req.user.role !== "user") {
      return res.status(403).json({
        success: false,
        message: "Only user can buy medicine",
      });
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
    }

    const medical = await Medical.findOneAndUpdate(
      {
        _id: id,
        isDeleted: false,
        status: "active",
        stock: { $gte: quantity },
      },
      {
        $inc: { stock: -quantity },
      },
      {
        new: true,
      },
    );

    if (!medical) {
      return res.status(400).json({
        success: false,
        message: "Medicine is not available or stock is not enough",
      });
    }

    let order;

    try {
      order = await MedicalOrder.create({
        userId,
        hospitalId: medical.hospitalId,
      medicalId: medical._id,
      medicalStoreId: medical.medicalStoreId,
      quantity,
        unitPrice: medical.price,
        totalAmount: medical.price * quantity,
      });
    } catch (err) {
      await Medical.findByIdAndUpdate(medical._id, {
        $inc: { stock: quantity },
      });

      throw err;
    }

    const [user, hospital, store] = await Promise.all([
      User.findById(userId),
      Hospital.findById(medical.hospitalId),
      medical.medicalStoreId ? MedicalStore.findById(medical.medicalStoreId) : null,
    ]);

    const orderHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background: #f4f7fb;">
        <div style="max-width: 640px; margin: auto; background: white; border-radius: 10px; overflow: hidden;">
          <div style="background: #0f766e; color: white; padding: 20px; text-align: center;">
            <h1>Medicine Order Placed</h1>
          </div>
          <div style="padding: 30px;">
            <p>Hello ${user?.name || "Patient"},</p>
            <p>Your medicine order has been placed successfully.</p>
            <div style="background: #f1f5f9; padding: 16px; border-radius: 8px;">
              <p><b>Medicine:</b> ${medical.medicineName}</p>
              <p><b>Quantity:</b> ${quantity}</p>
              <p><b>Total:</b> Rs. ${medical.price * quantity}</p>
              <p><b>Hospital:</b> ${hospital?.hospitalName || "Hospital pharmacy"}</p>
              <p><b>Medical:</b> ${store?.medicalName || "Medical store"}</p>
            </div>
            <p style="margin-top: 20px;">You can track this order from your MediCore medical orders page.</p>
          </div>
        </div>
      </div>
    `;

    try {
      if (user?.email) {
        await mailSender(user.email, "Medicine Order Placed", orderHtml);
      }
      if (store?.email) {
        await mailSender(store.email, "New Medicine Order Received", orderHtml);
      }
    } catch (mailError) {
      console.log("Medicine order email failed:", mailError.message);
    }

    return res.status(201).json({
      success: true,
      message: "Medicine order placed successfully",
      data: order,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// get user medical orders
exports.getMyMedicalOrders = async (req, res) => {
  try {
    if (req.user.role !== "user") {
      return res.status(403).json({
        success: false,
        message: "Only user can view orders",
      });
    }

    const userId = req.user._id || req.user.id;
    const orders = await MedicalOrder.find({ userId })
      .populate("hospitalId")
      .populate("medicalId")
      .populate("medicalStoreId")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Medical orders fetched successfully",
      count: orders.length,
      data: orders,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// get hospital medical orders
exports.getHospitalMedicalOrders = async (req, res) => {
  try {
    const hospitalId = await getHospitalId(req);
    const medicalStoreId = await getMedicalStoreId(req);

    if (!hospitalId || (req.user.role === "medical" && !medicalStoreId)) {
      return res.status(403).json({
        success: false,
        message: "Only hospital or medical can view medical orders",
      });
    }

    const filter = { hospitalId };
    if (medicalStoreId) filter.medicalStoreId = medicalStoreId;

    const orders = await MedicalOrder.find(filter)
      .populate("userId", "-password -otp -otpExpire")
      .populate("medicalId")
      .populate("medicalStoreId")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Hospital medical orders fetched successfully",
      count: orders.length,
      data: orders,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// update medical order status
exports.updateMedicalOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const hospitalId = await getHospitalId(req);
    const medicalStoreId = await getMedicalStoreId(req);
    const allowedStatus = ["placed", "ready", "completed", "cancelled"];

    if (!hospitalId || (req.user.role === "medical" && !medicalStoreId)) {
      return res.status(403).json({
        success: false,
        message: "Only hospital or medical can update medical order",
      });
    }

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Valid order status is required",
      });
    }

    const filter = { _id: id, hospitalId };
    if (medicalStoreId) filter.medicalStoreId = medicalStoreId;

    const order = await MedicalOrder.findOne(filter);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Medical order not found",
      });
    }

    if (order.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cancelled order cannot be updated",
      });
    }

    if (status === "cancelled") {
      await Medical.findByIdAndUpdate(order.medicalId, {
        $inc: { stock: order.quantity },
      });
    }

    order.status = status;
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Medical order updated successfully",
      data: order,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};
