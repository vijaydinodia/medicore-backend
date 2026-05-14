const SubDepartment = require("../model/subDepartmentModel");

// create subdepartment 
exports.createSubDepartment = async (req, res) => {
  try {
    const {
      hospitalId,
      departmentId,
      subDepartmentName,
      subDepartmentCode,
      description,
      headOfSubDepartment,
      totalDoctors,
      totalStaff,
      consultationFee,
      roomNumber,
      timings,
      services,
      isEmergencyAvailable,
      status,
     
    } = req.body;

    // validation
    if (
      !(hospitalId && departmentId && subDepartmentName && subDepartmentCode)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Hospital Id, Department Id, Sub Department Name and Sub Department Code are required",
      });
    }

    // check existing sub department
    const alreadyExists = await SubDepartment.findOne({
      $or: [
        {
          subDepartmentName: subDepartmentName.trim(),
        },
        {
          subDepartmentCode: subDepartmentCode.trim(),
        },
      ],
    });

    if (alreadyExists) {
      return res.status(400).json({
        success: false,
        message: "Sub Department already exists",
      });
    }

    // create sub department
    const newSubDepartment = await SubDepartment.create({
      hospitalId,

      departmentId,

      subDepartmentName: subDepartmentName.trim(),

      subDepartmentCode: subDepartmentCode.trim(),

      description: description ? description.trim() : "",

      headOfSubDepartment: headOfSubDepartment || null,

      totalDoctors: totalDoctors || 0,

      totalStaff: totalStaff || 0,

      consultationFee: consultationFee || 0,

      roomNumber: roomNumber || "",

      timings: timings || {
        openingTime: "",
        closingTime: "",
      },

      services: services || [],

      isEmergencyAvailable: isEmergencyAvailable || false,

      status: status || "active",

    });

    return res.status(201).json({
      success: true,
      message: "Sub Department created successfully",
      data: newSubDepartment,
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

//get all
exports.getAllSubDepartments = async (req, res) => {
  try {
    const subDepartments = await SubDepartment.find()
      .populate("hospitalId")
      .populate("departmentId")
      .populate("headOfSubDepartment");

    return res.status(200).json({
      success: true,
      count: subDepartments.length,
      data: subDepartments,
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

//get one 
exports.getSingleSubDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    const subDepartment = await SubDepartment.findById(id)
      .populate("hospitalId")
      .populate("departmentId")
      .populate("headOfSubDepartment");

    if (!subDepartment) {
      return res.status(404).json({
        success: false,
        message: "Sub Department not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: subDepartment,
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

// update subdepartment 
exports.updateSubDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      hospitalId,
      departmentId,
      subDepartmentName,
      subDepartmentCode,
      description,
      headOfSubDepartment,
      totalDoctors,
      totalStaff,
      consultationFee,
      roomNumber,
      timings,
      services,
      isEmergencyAvailable,
      status,
    
    } = req.body;

    // check sub department exists
    const existingSubDepartment = await SubDepartment.findById(id);

    if (!existingSubDepartment) {
      return res.status(404).json({
        success: false,
        message: "Sub Department not found",
      });
    }

    // duplicate code check
    if (subDepartmentCode) {
      const duplicateSubDepartment = await SubDepartment.findOne({
        subDepartmentCode: subDepartmentCode.trim(),
        _id: {
          $ne: id,
        },
      });

      if (duplicateSubDepartment) {
        return res.status(400).json({
          success: false,
          message: "Sub Department code already exists",
        });
      }
    }

    // update sub department
    const updatedSubDepartment = await SubDepartment.findByIdAndUpdate(
      id,
      {
        hospitalId: hospitalId || existingSubDepartment.hospitalId,

        departmentId: departmentId || existingSubDepartment.departmentId,

        subDepartmentName: subDepartmentName
          ? subDepartmentName.trim()
          : existingSubDepartment.subDepartmentName,

        subDepartmentCode: subDepartmentCode
          ? subDepartmentCode.trim()
          : existingSubDepartment.subDepartmentCode,

        description:
          description !== undefined
            ? description.trim()
            : existingSubDepartment.description,

        headOfSubDepartment:
          headOfSubDepartment !== undefined
            ? headOfSubDepartment
            : existingSubDepartment.headOfSubDepartment,

        totalDoctors:
          totalDoctors !== undefined
            ? totalDoctors
            : existingSubDepartment.totalDoctors,

        totalStaff:
          totalStaff !== undefined
            ? totalStaff
            : existingSubDepartment.totalStaff,

        consultationFee:
          consultationFee !== undefined
            ? consultationFee
            : existingSubDepartment.consultationFee,

        roomNumber:
          roomNumber !== undefined
            ? roomNumber
            : existingSubDepartment.roomNumber,

        timings: timings || existingSubDepartment.timings,

        services: services || existingSubDepartment.services,

        isEmergencyAvailable:
          isEmergencyAvailable !== undefined
            ? isEmergencyAvailable
            : existingSubDepartment.isEmergencyAvailable,

        status: status || existingSubDepartment.status,

      },
      { new: true },
    );

    return res.status(200).json({
      success: true,
      message: "Sub Department updated successfully",
      data: updatedSubDepartment,
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
exports.softDeleteSubDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    // check sub department exists
    const existingSubDepartment = await SubDepartment.findById(id);

    if (!existingSubDepartment) {
      return res.status(404).json({
        success: false,
        message: "Sub Department not found",
      });
    }

    // soft delete
    existingSubDepartment.status = "inactive";

    await existingSubDepartment.save();

    return res.status(200).json({
      success: true,
      message: "Sub Department soft deleted successfully",
      data: existingSubDepartment,
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

// restore department
exports.restoreSubDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    // check sub department exists
    const existingSubDepartment = await SubDepartment.findById(id);

    if (!existingSubDepartment) {
      return res.status(404).json({
        success: false,
        message: "Sub Department not found",
      });
    }

    // restore
    existingSubDepartment.status = "active";

    await existingSubDepartment.save();

    return res.status(200).json({
      success: true,
      message: "Sub Department restored successfully",
      data: existingSubDepartment,
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

// HARD DELETE
exports.hardDeleteSubDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    // check sub department exists
    const existingSubDepartment = await SubDepartment.findById(id);

    if (!existingSubDepartment) {
      return res.status(404).json({
        success: false,
        message: "Sub Department not found",
      });
    }

    // hard delete
    await SubDepartment.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Sub Department deleted permanently",
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
