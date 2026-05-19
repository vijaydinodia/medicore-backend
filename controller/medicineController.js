const Appointment = require("../model/appointmentModel");
const Doctor = require("../model/doctorModel");
const Medicine = require("../model/medicineModel");
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
