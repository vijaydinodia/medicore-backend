const Appointment = require("../model/appointmentModel");
const Doctor = require("../model/doctorModel");
const Hospital = require("../model/hospitalModel");
const Medicine = require("../model/medicineModel");
const Report = require("../model/reportModel");
const User = require("../model/userModel");
const Test = require("../model/testModel");
const mailSender = require("../utils/mailSender");
const appointmentBookedTemplate = require("../templates/appointmentBookedTemplate");

const getMinutesFromClock = (value) => {
  if (!value || typeof value !== "string") return null;

  const [time, meridiemValue = ""] = value.trim().split(/\s+/);
  const [hourValue, minuteValue] = time.split(":");
  const meridiem = meridiemValue.toUpperCase();
  let hours = Number(hourValue);
  const minutes = Number(minuteValue);

  if (Number.isNaN(hours) || Number.isNaN(minutes) || minutes > 59 || minutes < 0) return null;

  if (meridiem === "PM" && hours < 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;

  if (hours > 23 || hours < 0) return null;

  return hours * 60 + minutes;
};

const formatMinutes = (value) => {
  const hours24 = Math.floor(value / 60);
  const minutes = value % 60;
  const meridiem = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;

  return `${hours12}:${String(minutes).padStart(2, "0")} ${meridiem}`;
};

const buildTimeSlots = (availableTime = {}) => {
  const start = getMinutesFromClock(availableTime.startTime);
  const end = getMinutesFromClock(availableTime.endTime);

  if (start === null || end === null || end <= start) return [];

  const slots = [];

  for (let slotStart = start; slotStart + 30 <= end; slotStart += 30) {
    slots.push(`${formatMinutes(slotStart)} - ${formatMinutes(slotStart + 30)}`);
  }

  return slots;
};

const getDayRange = (dateValue = new Date()) => {
  let date = dateValue instanceof Date ? new Date(dateValue) : new Date(dateValue);

  if (typeof dateValue === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    const [year, month, day] = dateValue.split("-").map(Number);
    date = new Date(year, month - 1, day);
  }

  if (Number.isNaN(date.getTime())) return null;

  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
};

const getDoctorIdFromRequest = async (req) => {
  if (req.user.role !== "doctor") {
    return null;
  }

  const doctorUser = await User.findById(req.user._id || req.user.id).select("doctorId email");

  if (doctorUser && doctorUser.doctorId) {
    return doctorUser.doctorId;
  }

  const doctor = await Doctor.findOne({ email: req.user.email }).select("_id");

  if (!doctor) {
    return null;
  }

  return doctor._id;
};

const getHospitalIdFromRequest = async (req) => {
  if (req.user.role !== "hospital" && req.user.role !== "admin" && req.user.role !== "receptionist") {
    return null;
  }

  const account = await User.findById(req.user._id || req.user.id).select("hospitalId");

  if (!account || !account.hospitalId) {
    return null;
  }

  return account.hospitalId;
};

const attachMedicineToAppointments = async (appointments) => {
  const plainAppointments = [];
  const appointmentIds = [];

  for (const appointment of appointments) {
    const plainAppointment = typeof appointment.toObject === "function" ? appointment.toObject() : appointment;
    plainAppointments.push(plainAppointment);
    appointmentIds.push(plainAppointment._id);
  }

  const medicines = await Medicine.find({ appointmentId: { $in: appointmentIds } })
    .populate("tests.testId")
    .populate("tests.labId")
    .sort({ createdAt: -1 })
    .lean();
  const reports = await Report.find({ appointmentId: { $in: appointmentIds } })
    .populate("testId")
    .populate("labId")
    .sort({ createdAt: -1 })
    .lean();
  const finalAppointments = [];

  for (const appointment of plainAppointments) {
    let appointmentMedicine = null;

    for (const medicine of medicines) {
      if (String(medicine.appointmentId) === String(appointment._id)) {
        appointmentMedicine = medicine;
        break;
      }
    }

    finalAppointments.push({
      ...appointment,
      medicine: appointmentMedicine,
      reports: reports.filter((report) => String(report.appointmentId) === String(appointment._id)),
    });
  }

  return finalAppointments;
};

const attachSharedMedicalHistory = async (appointments) => {
  const appointmentsWithMedicine = await attachMedicineToAppointments(appointments);

  for (const appointment of appointmentsWithMedicine) {
    const userId = appointment.userId && appointment.userId._id ? appointment.userId._id : appointment.userId;

    const previousAppointments = await Appointment.find({
      userId,
      _id: { $ne: appointment._id },
      shareMedicalHistory: true,
    })
      .populate("doctorId")
      .populate("hospitalId")
      .sort({ date: -1, createdAt: -1 })
      .lean();

    appointment.medicalHistory = await attachMedicineToAppointments(previousAppointments);
  }

  return appointmentsWithMedicine;
};


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
    const appointmentsWithMedicine = await attachMedicineToAppointments(appointments);

    return res.status(200).json({
      success: true,
      count: appointmentsWithMedicine.length,
      data: appointmentsWithMedicine,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

//get doctor appointments
exports.getDoctorAppointments = async (req, res) => {
  try {
    const doctorId = await getDoctorIdFromRequest(req);

    if (!doctorId) {
      return res.status(403).json({
        success: false,
        message: "Only doctor can view appointments",
      });
    }

    const range = getDayRange(req.query.date || new Date());

    if (!range) {
      return res.status(400).json({
        success: false,
        message: "Valid date is required",
      });
    }

    const appointments = await Appointment.find({
      doctorId,
      date: { $gte: range.start, $lt: range.end },
    })
      .populate("userId", "-password -otp -otpExpire")
      .populate("doctorId")
      .populate("hospitalId")
      .sort({ date: 1, timeSlot: 1 });
    const appointmentsWithHistory = await attachSharedMedicalHistory(appointments);

    return res.status(200).json({
      success: true,
      count: appointmentsWithHistory.length,
      data: appointmentsWithHistory,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

//get hospital patient and doctor attendance stats
exports.getHospitalAppointmentStats = async (req, res) => {
  try {
    const hospitalId = await getHospitalIdFromRequest(req);

    if (!hospitalId) {
      return res.status(403).json({
        success: false,
        message: "Only hospital can view patient stats",
      });
    }

    const range = getDayRange(req.query.date || new Date());

    if (!range) {
      return res.status(400).json({
        success: false,
        message: "Valid date is required",
      });
    }

    const todayAppointments = await Appointment.find({
      hospitalId,
      date: { $gte: range.start, $lt: range.end },
    })
      .populate("userId", "-password -otp -otpExpire")
      .populate("doctorId")
      .populate("hospitalId")
      .sort({ date: 1, timeSlot: 1 })
      .lean();
    const appointmentsWithMedicine = await attachMedicineToAppointments(todayAppointments);
    const reachedAppointments = appointmentsWithMedicine.filter((appointment) => appointment.isReached);
    const completedAppointments = appointmentsWithMedicine.filter((appointment) => appointment.status === "completed");
    const doctorStats = [];

    for (const appointment of reachedAppointments) {
      const doctorId = String(appointment.doctorId && appointment.doctorId._id ? appointment.doctorId._id : appointment.doctorId || "");

      if (!doctorId) {
        continue;
      }

      let existingDoctor = null;

      for (const doctor of doctorStats) {
        if (doctor.doctorId === doctorId) {
          existingDoctor = doctor;
          break;
        }
      }

      if (existingDoctor) {
        existingDoctor.attendedPatients += 1;
      } else {
        doctorStats.push({
          doctorId,
          doctorName: appointment.doctorId && appointment.doctorId.doctorName ? appointment.doctorId.doctorName : "Doctor",
          specialization: appointment.doctorId && appointment.doctorId.specialization ? appointment.doctorId.specialization : "",
          attendedPatients: 1,
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        date: range.start,
        todayPatients: appointmentsWithMedicine.length,
        reachedPatients: reachedAppointments.length,
        completedPatients: completedAppointments.length,
        doctorsAttended: doctorStats.length,
        doctorStats,
        appointments: appointmentsWithMedicine,
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

//mark patient reached
exports.markReached = async (req, res) => {
  try {
    const doctorId = await getDoctorIdFromRequest(req);

    if (!doctorId) {
      return res.status(403).json({
        success: false,
        message: "Only doctor can update reached status",
      });
    }

    const appointment = await Appointment.findOne({ _id: req.params.id, doctorId });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    appointment.isReached = true;
    if (appointment.status === "pending") appointment.status = "confirmed";
    await appointment.save();

    const updatedAppointment = await appointment.populate([
      { path: "userId", select: "-password -otp -otpExpire" },
      { path: "doctorId" },
      { path: "hospitalId" },
    ]);

    return res.status(200).json({
      success: true,
      message: "Patient marked as reached",
      data: updatedAppointment,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

//user controls medical history sharing
exports.updateShareMedicalHistory = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    if (req.user.role !== "user") {
      return res.status(403).json({
        success: false,
        message: "Only user can update medical history sharing",
      });
    }

    const appointment = await Appointment.findOne({ _id: req.params.id, userId });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    appointment.shareMedicalHistory = req.body.shareMedicalHistory !== false;
    await appointment.save();

    return res.status(200).json({
      success: true,
      message: "Medical history sharing updated",
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

//cancel appointment
exports.cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    if (req.user.role !== "user") {
      return res.status(403).json({
        success: false,
        message: "Only user can cancel appointment",
      });
    }

    const appointment = await Appointment.findOne({ _id: id, userId });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    if (appointment.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Completed appointment cannot be cancelled",
      });
    }

    if (appointment.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Appointment is already cancelled",
      });
    }

    appointment.status = "cancelled";
    await appointment.save();

    const cancelledAppointment = await appointment.populate([
      { path: "doctorId" },
      { path: "hospitalId" },
    ]);

    return res.status(200).json({
      success: true,
      message: "Appointment cancelled successfully",
      data: cancelledAppointment,
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
    const { doctorId, hospitalId, date, timeSlot, paymentStatus } = req.body;
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

    const allowedTimeSlots = buildTimeSlots(doctor.availableTime);

    if (!allowedTimeSlots.length || !allowedTimeSlots.includes(timeSlot.trim())) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid doctor time slot",
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
      paymentStatus: paymentStatus || "pending",
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

// get all hospital appointments for receptionist/admin
exports.getHospitalAppointments = async (req, res) => {
  try {
    const hospitalId = await getHospitalIdFromRequest(req);

    if (!hospitalId) {
      return res.status(403).json({
        success: false,
        message: "Only hospital admin or receptionist can view hospital appointments",
      });
    }

    const appointments = await Appointment.find({ hospitalId })
      .populate("userId", "-password -otp -otpExpire")
      .populate("doctorId")
      .populate("hospitalId")
      .sort({ date: -1, timeSlot: 1 });

    const appointmentsWithMedicine = await attachMedicineToAppointments(appointments);

    return res.status(200).json({
      success: true,
      count: appointmentsWithMedicine.length,
      data: appointmentsWithMedicine,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// verify appointment payment status by receptionist
exports.verifyAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus, paymentMethod } = req.body;

    if (req.user.role !== "receptionist" && req.user.role !== "hospital" && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only receptionist or hospital admin can verify appointments",
      });
    }

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Update paymentStatus if provided
    if (paymentStatus) {
      appointment.paymentStatus = paymentStatus;
    }

    // Auto update status based on payment verification
    if (appointment.paymentStatus === "done") {
      appointment.status = "confirmed";
      appointment.paymentMethod = paymentMethod || "cash";
      appointment.verifiedBy = req.user._id || req.user.id;
      
      // Get consultation fee
      const doctor = await Doctor.findById(appointment.doctorId);
      appointment.paymentAmount = doctor ? doctor.consultationFee : 0;
    } else {
      appointment.status = "pending";
      appointment.paymentMethod = "";
      appointment.verifiedBy = null;
      appointment.paymentAmount = 0;
    }

    await appointment.save();

    const updatedAppointment = await appointment.populate([
      { path: "userId", select: "-password -otp -otpExpire" },
      { path: "doctorId" },
      { path: "hospitalId" },
    ]);

    return res.status(200).json({
      success: true,
      message: appointment.paymentStatus === "done" 
        ? "Appointment verified and confirmed successfully" 
        : "Appointment verified and remains in pending process",
      data: updatedAppointment,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// get all medicines with tests for hospital reception to collect fees
exports.getHospitalTestsToCollectFees = async (req, res) => {
  try {
    const hospitalId = await getHospitalIdFromRequest(req);

    if (!hospitalId) {
      return res.status(403).json({
        success: false,
        message: "Only hospital admin or receptionist can view test fees",
      });
    }

    // Find appointments of this hospital
    const appointments = await Appointment.find({ hospitalId }).select("_id");
    const appointmentIds = appointments.map((app) => app._id);

    // Find prescriptions with tests
    const medicines = await Medicine.find({ appointmentId: { $in: appointmentIds } })
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

    return res.status(200).json({
      success: true,
      count: medicines.length,
      data: medicines,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// collect lab test fee
exports.collectTestFee = async (req, res) => {
  try {
    const { medicineId, testId, paymentMethod } = req.body;

    if (req.user.role !== "receptionist" && req.user.role !== "hospital" && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only receptionist or hospital admin can collect test fees",
      });
    }

    const medicine = await Medicine.findById(medicineId);
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: "Prescription record not found",
      });
    }

    // Query test model to find amount
    const testDoc = await Test.findById(testId);
    const amount = testDoc ? testDoc.amount : 0;

    let testFound = false;
    for (const test of medicine.tests) {
      if (String(test.testId?._id || test.testId || test._id) === String(testId)) {
        test.paymentStatus = "done";
        test.paymentMethod = paymentMethod || "cash";
        test.verifiedBy = req.user._id || req.user.id;
        test.paymentAmount = amount;
        testFound = true;
        break;
      }
    }

    if (!testFound) {
      return res.status(404).json({
        success: false,
        message: "Test not found in prescription record",
      });
    }

    await medicine.save();

    const updatedMedicine = await Medicine.findById(medicineId)
      .populate({
        path: "appointmentId",
        populate: [
          { path: "userId", select: "-password -otp -otpExpire" },
          { path: "doctorId" },
          { path: "hospitalId" },
        ],
      })
      .populate("tests.testId")
      .populate("tests.labId");

    return res.status(200).json({
      success: true,
      message: "Test fee collected successfully",
      data: updatedMedicine,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// Get overall revenue stats for hospital (for charts & dashboard)
exports.getHospitalOverviewStats = async (req, res) => {
  try {
    const hospitalId = await getHospitalIdFromRequest(req);

    if (!hospitalId) {
      return res.status(403).json({
        success: false,
        message: "Only hospital admin or receptionist can view dashboard stats",
      });
    }

    // 1. Fetch receptionists to build baseline names mapping
    const receptionistUsers = await User.find({ hospitalId, role: "receptionist" })
      .select("name _id")
      .lean();

    const receptionistRevenue = {};
    for (const rx of receptionistUsers) {
      receptionistRevenue[String(rx._id)] = {
        receptionistId: rx._id,
        name: rx.name,
        amount: 0,
      };
    }

    // 2. Fetch all appointments (sorted by date desc, then timeSlot)
    const appointments = await Appointment.find({ hospitalId })
      .populate("doctorId", "doctorName consultationFee")
      .populate("userId", "name phone")
      .populate("verifiedBy", "name")
      .sort({ createdAt: -1 })
      .lean();

    // 3. Fetch all medicines and their test fees
    const appointmentIds = appointments.map((app) => app._id);
    const medicines = await Medicine.find({ appointmentId: { $in: appointmentIds } })
      .populate("tests.testId", "testName amount")
      .populate("tests.verifiedBy", "name")
      .lean();

    // Stats calculations
    let totalConsultationRevenue = 0;
    let totalLabRevenue = 0;
    const paymentMethods = { cash: 0, upi: 0, card: 0 };
    const dailyMap = {};

    // Helper functions for fallback amount
    const getAppAmount = (app) => {
      if (app.paymentAmount !== undefined && app.paymentAmount > 0) return app.paymentAmount;
      return app.doctorId?.consultationFee || 0;
    };

    const getTestAmount = (test) => {
      if (test.paymentAmount !== undefined && test.paymentAmount > 0) return test.paymentAmount;
      return test.testId?.amount || 0;
    };

    // Aggregate appointments
    for (const app of appointments) {
      if (app.paymentStatus === "done") {
        const amt = getAppAmount(app);
        totalConsultationRevenue += amt;

        // Payment Method breakdown
        const method = (app.paymentMethod || "cash").toLowerCase();
        if (paymentMethods[method] !== undefined) {
          paymentMethods[method] += amt;
        } else {
          paymentMethods.cash += amt;
        }

        // Receptionist breakdown
        if (app.verifiedBy) {
          const rId = String(app.verifiedBy._id || app.verifiedBy);
          if (!receptionistRevenue[rId]) {
            receptionistRevenue[rId] = { receptionistId: rId, name: app.verifiedBy.name || "Staff", amount: 0 };
          }
          receptionistRevenue[rId].amount += amt;
        }

        // Daily trend
        const dateObj = app.createdAt || app.date;
        const dateStr = new Date(dateObj).toISOString().slice(0, 10);
        if (!dailyMap[dateStr]) {
          dailyMap[dateStr] = { date: dateStr, consultation: 0, lab: 0, total: 0 };
        }
        dailyMap[dateStr].consultation += amt;
        dailyMap[dateStr].total += amt;
      }
    }

    // Aggregate lab tests
    for (const med of medicines) {
      if (med.tests && med.tests.length > 0) {
        for (const test of med.tests) {
          if (test.paymentStatus === "done") {
            const amt = getTestAmount(test);
            totalLabRevenue += amt;

            // Payment Method breakdown
            const method = (test.paymentMethod || "cash").toLowerCase();
            if (paymentMethods[method] !== undefined) {
              paymentMethods[method] += amt;
            } else {
              paymentMethods.cash += amt;
            }

            // Receptionist breakdown
            if (test.verifiedBy) {
              const rId = String(test.verifiedBy._id || test.verifiedBy);
              if (!receptionistRevenue[rId]) {
                receptionistRevenue[rId] = { receptionistId: rId, name: test.verifiedBy.name || "Staff", amount: 0 };
              }
              receptionistRevenue[rId].amount += amt;
            }

            // Daily trend
            const dateObj = test.updatedAt || med.createdAt;
            const dateStr = new Date(dateObj).toISOString().slice(0, 10);
            if (!dailyMap[dateStr]) {
              dailyMap[dateStr] = { date: dateStr, consultation: 0, lab: 0, total: 0 };
            }
            dailyMap[dateStr].lab += amt;
            dailyMap[dateStr].total += amt;
          }
        }
      }
    }

    // Process daily trend to sort and fill empty days in last 30 days
    const dailyTrend = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      
      const dayData = dailyMap[dateStr] || { date: dateStr, consultation: 0, lab: 0, total: 0 };
      dailyTrend.push(dayData);
    }

    return res.status(200).json({
      success: true,
      data: {
        totalRevenue: totalConsultationRevenue + totalLabRevenue,
        consultationRevenue: totalConsultationRevenue,
        labRevenue: totalLabRevenue,
        paymentMethods,
        receptionistBreakdown: Object.values(receptionistRevenue),
        dailyTrend,
        appointmentCount: appointments.length,
        pendingAppointments: appointments.filter(a => a.status === "pending").length,
        confirmedAppointments: appointments.filter(a => a.status === "confirmed").length,
        completedAppointments: appointments.filter(a => a.status === "completed").length,
        recentAppointments: appointments.slice(0, 5),
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
