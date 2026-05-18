const Appointment = require("../model/appointmentModel");
const Doctor = require("../model/doctorModel");
const Hospital = require("../model/hospitalModel");
const User = require("../model/userModel");
const mailSender = require("../utils/mailSender");
const appointmentBookedTemplate = require("../templates/appointmentBookedTemplate");

//get user appointments
exports.getMyAppointments = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    if (req.user.role !== "user") {
      return res.status(403).json({
        success: false,
        message: "Only user can view appointment history",
      });
    }

    const appointments = await Appointment.find({ userId })
      .populate("doctorId")
      .populate("hospitalId")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

//create appointment
exports.createAppointment = async (req, res) => {
  try {
    const { doctorId, hospitalId, date, timeSlot } = req.body;
    const userId = req.user._id || req.user.id;

    // validation
    if (!(doctorId && hospitalId && date && timeSlot)) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (req.user.role !== "user") {
      return res.status(403).json({
        success: false,
        message: "Only user can book appointment",
      });
    }

    // check user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // check hospital
    const hospital = await Hospital.findOne({
      _id: hospitalId,
      isDeleted: false,
      isActive: true,
      status: "approved",
    });

    if (!hospital) {
      return res.status(400).json({
        success: false,
        message: "Hospital is not active",
      });
    }

    // check doctor
    const doctor = await Doctor.findOne({
      _id: doctorId,
      hospitalId,
      status: "active",
    });

    if (!doctor) {
      return res.status(400).json({
        success: false,
        message: "Doctor is not active in this hospital",
      });
    }

    const appointmentDate = new Date(date);

    if (Number.isNaN(appointmentDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Valid appointment date is required",
      });
    }

    // create appointment
    const newAppointment = await Appointment.create({
      userId,
      doctorId,
      hospitalId,
      date: appointmentDate,
      timeSlot: timeSlot.trim(),
    });

    hospital.appointments = hospital.appointments || [];
    hospital.appointments.push(newAppointment._id);
    await hospital.save();

    const mailDate = appointmentDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    // send mail
    await mailSender(
      user.email,
      "Appointment Booked Successfully",
      appointmentBookedTemplate({
        userName: user.name,
        doctorName: doctor.doctorName,
        hospitalName: hospital.hospitalName,
        date: mailDate,
        timeSlot: newAppointment.timeSlot,
        status: newAppointment.status,
      }),
    );

    const appointment = await newAppointment.populate([
      { path: "userId" },
      { path: "doctorId" },
      { path: "hospitalId" },
    ]);

    return res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      data: appointment,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};
