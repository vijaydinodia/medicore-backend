const department = require("../model/departmentModel");

//create department
exports.createDepartment = async (req, res) => {
  try {
    const {
      hospitalId,
      departmentName,
      departmentCode,
      description,
      headOfDepartment,
      totalDoctors,
      totalStaff,
      consultationFee,
      roomNumber,
      timings,
      facilities,
      isEmergencyAvailable,
      status,
    } = req.body;

    if (!(hospitalId && departmentName && departmentCode)) {
      return res.status(400).json({
        success: false,

        message:
          "Hospital Id, Department Name and Department Code are required",
      });
    }

    //check existing department
    const alreadyExists = await department.findOne({
      $or: [
        { departmentName: departmentName.trim() },
        { departmentCode: departmentCode.trim() },
      ],
    });

    if (alreadyExists) {
      return res.status(400).json({
        success: false,
        message: "Department already exists",
      });
    }

    //create department
    const newDepartment = await department.create({
      hospitalId,
      departmentName: departmentName.trim(),
      departmentCode: departmentCode.trim(),
      description: description ? description.trim() : "",
      headOfDepartment: headOfDepartment || null,
      totalDoctors: totalDoctors || 0,
      totalStaff: totalStaff || 0,
      consultationFee: consultationFee || 0,
      roomNumber: roomNumber || "",
      timings: timings || {
        openingTime: "",
        closingTime: "",
      },
      facilities: facilities || [],
      isEmergencyAvailable: isEmergencyAvailable || false,
      status,
    });

    return res.status(200).json({
      success: true,
      message: "Department is created successfully",
      data: newDepartment,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

//getAll department
exports.getAllDepartments = async (req, res) => {
  try {
    const departments = await department
      .find()
      .populate("hospitalId")
      .populate("headOfDepartment");

    return res.status(200).json({
      success: true,
      count: departments.length,
      data: departments,
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

//get one department
exports.getSingleDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    const departmnetExist = await department
      .findById(id)
      .populate("hospitalId")
      .populate("headOfDepartment");

    if (!departmnetExist) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: departmnetExist,
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

//update department
exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      hospitalId,
      departmentName,
      departmentCode,
      description,
      headOfDepartment,
      totalDoctors,
      totalStaff,
      consultationFee,
      roomNumber,
      timings,
      facilities,
      isEmergencyAvailable,
      status,
    } = req.body;

    // check department exists
    const existingDepartment = await department.findById(id);

    if (!existingDepartment) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    // check duplicate department code
    if (departmentCode) {
      const duplicateDepartment = await department.findOne({
        departmentCode: departmentCode.trim(),
        _id: { $ne: id },
      });

      if (duplicateDepartment) {
        return res.status(400).json({
          success: false,
          message: "Department code already exists",
        });
      }
    }

    // update department
    const updatedDepartment = await department.findByIdAndUpdate(
      id,
      {
        hospitalId: hospitalId || existingDepartment.hospitalId,

        departmentName: departmentName
          ? departmentName.trim()
          : existingDepartment.departmentName,

        departmentCode: departmentCode
          ? departmentCode.trim()
          : existingDepartment.departmentCode,

        description:
          description !== undefined
            ? description.trim()
            : existingDepartment.description,

        headOfDepartment:
          headOfDepartment !== undefined
            ? headOfDepartment
            : existingDepartment.headOfDepartment,

        totalDoctors:
          totalDoctors !== undefined
            ? totalDoctors
            : existingDepartment.totalDoctors,

        totalStaff:
          totalStaff !== undefined ? totalStaff : existingDepartment.totalStaff,

        consultationFee:
          consultationFee !== undefined
            ? consultationFee
            : existingDepartment.consultationFee,

        roomNumber:
          roomNumber !== undefined ? roomNumber : existingDepartment.roomNumber,

        timings: timings || existingDepartment.timings,

        facilities: facilities || existingDepartment.facilities,

        isEmergencyAvailable:
          isEmergencyAvailable !== undefined
            ? isEmergencyAvailable
            : existingDepartment.isEmergencyAvailable,

        status: status || existingDepartment.status,
      },
      { new: true },
    );

    return res.status(200).json({
      success: true,
      message: "Department updated successfully",
      data: updatedDepartment,
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

//softdelete department
exports.softDeleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(">>>>>>>>>>req.params>>>>>>>", req.params);
    console.log(">>>>>>>>>department id>>>>>>>>", id);
    // check department exists
    const existingDepartment = await department.findById(id);

    if (!existingDepartment) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    // soft delete
    existingDepartment.status = "inactive";

    await existingDepartment.save();

    return res.status(200).json({
      success: true,
      message: "Department soft deleted successfully",
      data: existingDepartment,
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

//restore department
exports.restoreDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    // check department exists
    const existingDepartment = await department.findById(id);

    if (!existingDepartment) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    // restore department
    existingDepartment.status = "active";

    await existingDepartment.save();

    return res.status(200).json({
      success: true,
      message: "Department restored successfully",
      data: existingDepartment,
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

//hard delete
exports.hardDeleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    // check department exists
    const existingDepartment = await department.findById(id);

    if (!existingDepartment) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    // hard delete
    await department.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Department deleted permanently",
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
