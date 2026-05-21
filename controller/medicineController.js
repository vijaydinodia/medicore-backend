const Appointment = require("../model/appointmentModel");
const Doctor = require("../model/doctorModel");
const Medicine = require("../model/medicineModel");
const Report = require("../model/reportModel");
const Test = require("../model/testModel");
const User = require("../model/userModel");

// save medicine
exports.saveMedicine = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const {
      symptoms,
      diagnosis,
      bloodPressure,
      temperature,
      weight,
      nextVisitDate,
      medicines,
      tests,
      notes,
    } = req.body;

    // only doctor can add medicine
    if (req.user.role !== "doctor") {
      return res.status(403).json({
        success: false,
        message: "Only doctor can save medicine",
      });
    }

    // get doctor id from login user
    const loginUser = await User.findById(req.user._id || req.user.id);

    if (!loginUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let doctorId = loginUser.doctorId;

    if (!doctorId) {
      const doctor = await Doctor.findOne({ email: loginUser.email });

      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: "Doctor not found",
        });
      }

      doctorId = doctor._id;
    }

    // check appointment
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      doctorId,
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // make medicine array clean
    const medicineList = [];

    if (Array.isArray(medicines)) {
      for (const item of medicines) {
        if (item.medicineName && item.medicineName.trim()) {
          medicineList.push({
            medicineName: item.medicineName.trim(),
            dosage: item.dosage ? item.dosage.trim() : "",
            timing: item.timing ? item.timing.trim() : "",
            days: Number(item.days) || 1,
            instruction: item.instruction ? item.instruction.trim() : "",
            morning: item.morning === true,
            afternoon: item.afternoon === true,
            night: item.night === true,
            beforeFood: item.beforeFood === true,
            afterFood: item.afterFood === true,
          });
        }
      }
    }

    // make test array clean
    const testList = [];

    if (Array.isArray(tests)) {
      for (const item of tests) {
        if (item.testId) {
          const test = await Test.findOne({
            _id: item.testId,
            hospitalId: appointment.hospitalId,
            isDeleted: false,
            status: "active",
          });

          if (test) {
            testList.push({
              testId: test._id,
              labId: test.labId,
              testName: test.testName,
              status: "pending",
            });
          }
        }
      }
    }

    // save or update medicine
    const savedMedicine = await Medicine.findOneAndUpdate(
      { appointmentId: appointment._id },
      {
        appointmentId: appointment._id,
        symptoms: symptoms ? symptoms.trim() : "",
        diagnosis: diagnosis ? diagnosis.trim() : "",
        bloodPressure: bloodPressure ? bloodPressure.trim() : "",
        temperature: temperature ? temperature.trim() : "",
        weight: weight ? weight.trim() : "",
        nextVisitDate: nextVisitDate ? new Date(nextVisitDate) : undefined,
        medicines: medicineList,
        tests: testList,
        notes: notes ? notes.trim() : "",
        status: "completed",
      },
      { new: true, upsert: true, runValidators: true },
    );

    // update appointment
    appointment.isReached = true;
    appointment.status = "completed";
    await appointment.save();

    // response
    return res.status(200).json({
      success: true,
      message: "Medicine saved successfully",
      data: savedMedicine,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// get lab test patients
exports.getLabTestPatients = async (req, res) => {
  try {
    if (req.user.role !== "lab") {
      return res.status(403).json({
        success: false,
        message: "Only lab can view test patients",
      });
    }

    const loginUser = await User.findById(req.user._id || req.user.id);

    if (!loginUser || !loginUser.labId) {
      return res.status(404).json({
        success: false,
        message: "Lab account details are missing",
      });
    }

    const medicines = await Medicine.find({ "tests.labId": loginUser.labId })
      .populate({
        path: "appointmentId",
        populate: [
          { path: "userId", select: "-password -otp -otpExpire" },
          { path: "doctorId" },
          { path: "hospitalId" },
        ],
      })
      .populate("tests.testId")
      .populate("tests.labId")
      .sort({ createdAt: -1 });
    const medicineIds = medicines.map((medicine) => medicine._id);
    const reports = await Report.find({
      medicineId: { $in: medicineIds },
      labId: loginUser.labId,
    });

    const data = [];

    for (const medicine of medicines) {
      const tests = [];

      for (const test of medicine.tests || []) {
        if (String(test.labId?._id || test.labId) === String(loginUser.labId)) {
          const report = reports.find((item) => {
            return (
              String(item.medicineId) === String(medicine._id) &&
              String(item.testId) === String(test.testId?._id || test.testId)
            );
          });

          tests.push({
            ...test.toObject(),
            report,
          });
        }
      }

      if (tests.length > 0) {
        data.push({
          _id: medicine._id,
          appointment: medicine.appointmentId,
          diagnosis: medicine.diagnosis,
          symptoms: medicine.symptoms,
          notes: medicine.notes,
          tests,
          createdAt: medicine.createdAt,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Lab test patients fetched successfully",
      count: data.length,
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};
