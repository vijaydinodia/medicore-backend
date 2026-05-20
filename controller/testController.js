const Test = require("../model/testModel");
const User = require("../model/userModel");

// create test
exports.createTest = async (req, res) => {
  try {
    const {
      hospitalId,
      labId,
      testName,
      testCode,
      category,
      sampleType,
      normalRange,
      unit,
      amount,
      reportTime,
      instructions,
      status,
    } = req.body;

    let finalHospitalId = hospitalId;
    let finalLabId = labId;

    if (req.user && req.user.role === "lab") {
      const loginUser = await User.findById(req.user._id || req.user.id);

      if (!loginUser || !loginUser.labId || !loginUser.hospitalId) {
        return res.status(400).json({
          success: false,
          message: "Lab account details are missing",
        });
      }

      finalHospitalId = loginUser.hospitalId;
      finalLabId = loginUser.labId;
    }

    if (req.user && (req.user.role === "hospital" || req.user.role === "admin")) {
      const loginUser = await User.findById(req.user._id || req.user.id);

      if (!loginUser || !loginUser.hospitalId) {
        return res.status(400).json({
          success: false,
          message: "Hospital account details are missing",
        });
      }

      finalHospitalId = loginUser.hospitalId;
      finalLabId = labId;
    }

    if (
      !req.user ||
      !["hospital", "admin", "lab"].includes(req.user.role)
    ) {
      return res.status(403).json({
        success: false,
        message: "Only hospital and lab can create test",
      });
    }

    // validation
    if (!(finalHospitalId && finalLabId && testName && testCode)) {
      return res.status(400).json({
        success: false,
        message: "Hospital Id, Lab Id, Test Name and Test Code are required",
      });
    }

    // check existing test
    const alreadyExists = await Test.findOne({
      $or: [
        { testCode: testCode.trim() },
        { testName: testName.trim(), labId: finalLabId },
      ],
    });

    if (alreadyExists) {
      return res.status(400).json({
        success: false,
        message: "Test already exists",
      });
    }

    // create test
    const newTest = await Test.create({
      hospitalId: finalHospitalId,
      labId: finalLabId,
      testName: testName.trim(),
      testCode: testCode.trim(),
      category: category ? category.trim() : "",
      sampleType: sampleType ? sampleType.trim() : "",
      normalRange: normalRange ? normalRange.trim() : "",
      unit: unit ? unit.trim() : "",
      amount: amount || 0,
      reportTime: reportTime || "",
      instructions: instructions ? instructions.trim() : "",
      status: status || "active",
    });

    return res.status(201).json({
      success: true,
      message: "Test created successfully",
      data: newTest,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// get all tests
exports.getAllTests = async (req, res) => {
  try {
    const canSeeDeleted =
      req.user && ["hospital", "admin", "lab"].includes(req.user.role);
    const includeDeleted = req.query.includeDeleted === "true" && canSeeDeleted;
    const filter = includeDeleted ? {} : { isDeleted: false };

    if (req.user && req.user.role === "lab") {
      const loginUser = await User.findById(req.user._id || req.user.id);

      if (loginUser && loginUser.labId) {
        filter.labId = loginUser.labId;
      }
    }

    if (req.user && (req.user.role === "hospital" || req.user.role === "admin")) {
      const loginUser = await User.findById(req.user._id || req.user.id);

      if (loginUser && loginUser.hospitalId) {
        filter.hospitalId = loginUser.hospitalId;
      }
    }

    const tests = await Test.find(filter)
      .populate("hospitalId")
      .populate("labId");

    return res.status(200).json({
      success: true,
      message: "Tests fetched successfully",
      count: tests.length,
      data: tests,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// get one test
exports.getOneTest = async (req, res) => {
  try {
    const { id } = req.params;

    const test = await Test.findOne({ _id: id, isDeleted: false })
      .populate("hospitalId")
      .populate("labId");

    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Test fetched successfully",
      data: test,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// get single test
exports.getSingleTest = async (req, res) => {
  try {
    const { id } = req.params;

    const test = await Test.findOne({ _id: id, isDeleted: false })
      .populate("hospitalId")
      .populate("labId");

    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Test fetched successfully",
      data: test,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// update test
exports.updateTest = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      hospitalId,
      labId,
      testName,
      testCode,
      category,
      sampleType,
      normalRange,
      unit,
      amount,
      reportTime,
      instructions,
      status,
    } = req.body;

    // check test exists
    const existingTest = await Test.findById(id);

    if (!existingTest) {
      return res.status(404).json({
        success: false,
        message: "Test not found",
      });
    }

    // check duplicate test code
    if (testCode) {
      const duplicateTest = await Test.findOne({
        testCode: testCode.trim(),
        _id: { $ne: id },
      });

      if (duplicateTest) {
        return res.status(400).json({
          success: false,
          message: "Test code already exists",
        });
      }
    }

    // update test
    const updatedTest = await Test.findByIdAndUpdate(
      id,
      {
        hospitalId: hospitalId || existingTest.hospitalId,
        labId: labId || existingTest.labId,
        testName: testName ? testName.trim() : existingTest.testName,
        testCode: testCode ? testCode.trim() : existingTest.testCode,
        category:
          category !== undefined ? category.trim() : existingTest.category,
        sampleType:
          sampleType !== undefined
            ? sampleType.trim()
            : existingTest.sampleType,
        normalRange:
          normalRange !== undefined
            ? normalRange.trim()
            : existingTest.normalRange,
        unit: unit !== undefined ? unit.trim() : existingTest.unit,
        amount: amount !== undefined ? amount : existingTest.amount,
        reportTime:
          reportTime !== undefined ? reportTime : existingTest.reportTime,
        instructions:
          instructions !== undefined
            ? instructions.trim()
            : existingTest.instructions,
        status: status || existingTest.status,
      },
      {
        new: true,
      },
    );

    return res.status(200).json({
      success: true,
      message: "Test updated successfully",
      data: updatedTest,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// delete test
exports.deleteTest = async (req, res) => {
  try {
    const { id } = req.params;

    const existingTest = await Test.findById(id);

    if (!existingTest) {
      return res.status(404).json({
        success: false,
        message: "Test not found",
      });
    }

    await Test.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Test deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// soft delete test
exports.softDeleteTest = async (req, res) => {
  try {
    const { id } = req.params;

    const existingTest = await Test.findById(id);

    if (!existingTest) {
      return res.status(404).json({
        success: false,
        message: "Test not found",
      });
    }

    // soft delete
    existingTest.isDeleted = true;
    existingTest.status = "inactive";

    await existingTest.save();

    return res.status(200).json({
      success: true,
      message: "Test soft deleted successfully",
      data: existingTest,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// restore test
exports.restoreTest = async (req, res) => {
  try {
    const { id } = req.params;

    const existingTest = await Test.findById(id);

    if (!existingTest) {
      return res.status(404).json({
        success: false,
        message: "Test not found",
      });
    }

    // restore test
    existingTest.isDeleted = false;
    existingTest.status = "active";

    await existingTest.save();

    return res.status(200).json({
      success: true,
      message: "Test restored successfully",
      data: existingTest,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// hard delete test
exports.hardDeleteTest = async (req, res) => {
  try {
    const { id } = req.params;

    const existingTest = await Test.findById(id);

    if (!existingTest) {
      return res.status(404).json({
        success: false,
        message: "Test not found",
      });
    }

    // hard delete
    await Test.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Test deleted permanently",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};
