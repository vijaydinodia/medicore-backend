const Report = require("../model/reportModel");
const Doctor = require("../model/doctorModel");
const Medicine = require("../model/medicineModel");
const User = require("../model/userModel");
const { uploadImage } = require("../utils/cloudnairy");

const cleanSvgText = (value) => {
  const fallbackText = "-";
  const text = value ? String(value) : fallbackText;

  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
};

const createLines = (text, length = 58) => {
  const words = String(text || "-").split(" ");
  const lines = [];
  let line = "";

  for (const word of words) {
    if (`${line} ${word}`.trim().length > length) {
      lines.push(line);
      line = word;
    } else {
      line = `${line} ${word}`.trim();
    }
  }

  if (line) {
    lines.push(line);
  }

  return lines.length ? lines : ["-"];
};

const createReportImage = (data) => {
  let y = 52;

  const text = (label, value) => {
    const safeLabel = cleanSvgText(label);
    const safeValue = cleanSvgText(value);
    const content = `<text x="48" y="${y}" class="label">${safeLabel}: <tspan class="value">${safeValue}</tspan></text>`;
    y += 30;
    return content;
  };

  const paragraph = (label, value) => {
    const lines = createLines(value);
    let content = `<text x="48" y="${y}" class="section">${cleanSvgText(label)}</text>`;
    y += 28;

    for (const line of lines) {
      content += `<text x="48" y="${y}" class="body">${cleanSvgText(line)}</text>`;
      y += 24;
    }

    y += 12;
    return content;
  };

  const body = [
    `<text x="450" y="${y}" text-anchor="middle" class="title">MediCore Lab Report</text>`,
    (() => {
      y += 48;
      return "";
    })(),
    text("Report Name", data.reportName),
    text("Report Type", data.reportType),
    text("Patient", data.patientName),
    text("Doctor", data.doctorName),
    text("Test", data.testName),
    text("Sample Type", data.sampleType),
    text("Report Date", data.reportDate),
    text("Result Value", data.resultValue),
    text("Normal Range", data.normalRange),
    text("Unit", data.unit),
    paragraph("Result", data.result),
    paragraph("Impression", data.impression),
    paragraph("Advice", data.advice),
    paragraph("Remarks", data.remarks),
    text("Technician", data.technicianName),
    text("Verified By", data.verifiedBy),
  ].join("");

  const height = Math.max(y + 40, 900);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="${height}" viewBox="0 0 900 ${height}">
      <rect width="900" height="${height}" fill="#f8fafc"/>
      <rect x="28" y="28" width="844" height="${height - 56}" rx="16" fill="#ffffff" stroke="#cbd5e1"/>
      <style>
        .title { font: 700 30px Arial, sans-serif; fill: #0f172a; }
        .label { font: 700 18px Arial, sans-serif; fill: #334155; }
        .value { font: 400 18px Arial, sans-serif; fill: #0f172a; }
        .section { font: 700 20px Arial, sans-serif; fill: #0f766e; }
        .body { font: 400 17px Arial, sans-serif; fill: #0f172a; }
      </style>
      ${body}
    </svg>
  `;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
};

// create report
exports.createReport = async (req, res) => {
  try {
    const {
      hospitalId,
      patientId,
      doctorId,
      appointmentId,
      medicineId,
      testId,
      labId,
      reportName,
      reportType,
      reportDate,
      patientName,
      doctorName,
      testName,
      sampleType,
      result,
      resultValue,
      normalRange,
      unit,
      impression,
      advice,
      technicianName,
      verifiedBy,
      fileUrl,
      publicId,
      fileName,
      remarks,
      status,
    } = req.body;

    let finalHospitalId = hospitalId;
    let finalLabId = labId;

    if (req.user && (req.user.role === "hospital" || req.user.role === "admin" || req.user.role === "lab")) {
      const loginUser = await User.findById(req.user._id || req.user.id);

      if (loginUser && loginUser.hospitalId) {
        finalHospitalId = loginUser.hospitalId;
      }

      if (req.user.role === "lab" && loginUser && loginUser.labId) {
        finalLabId = loginUser.labId;
      }
    }

    if (!req.user || !["hospital", "admin", "lab"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Only hospital and lab can create report",
      });
    }

    // validation
    if (
      !(
        finalHospitalId &&
        patientId &&
        doctorId &&
        appointmentId &&
        reportName &&
        reportType
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Hospital Id, Patient Id, Doctor Id, Appointment Id, Report Name and Report Type are required",
      });
    }

    let finalFileUrl = fileUrl;
    let finalPublicId = publicId || "";
    let finalFileName = fileName || "";

    if (req.file) {
      const reportUpload = await uploadImage(req.file, "medicore/reports");
      finalFileUrl = reportUpload[0]?.secure_url || "";
      finalPublicId = reportUpload[0]?.public_id || "";
      finalFileName = req.file.originalname || finalFileName;
    }

    if (!finalFileUrl) {
      const reportImage = createReportImage({
        reportName: reportName.trim(),
        reportType: reportType.trim(),
        patientName,
        doctorName,
        testName,
        sampleType,
        reportDate: reportDate || new Date().toLocaleDateString("en-IN"),
        result,
        resultValue,
        normalRange,
        unit,
        impression,
        advice,
        technicianName,
        verifiedBy,
        remarks,
      });

      const reportUpload = await uploadImage(reportImage, "medicore/reports", {
        resource_type: "image",
        format: "jpg",
      });

      finalFileUrl = reportUpload[0]?.secure_url || "";
      finalPublicId = reportUpload[0]?.public_id || "";
      finalFileName = reportUpload[0]?.original_filename
        ? `${reportUpload[0].original_filename}.jpg`
        : `${reportName.trim()}.jpg`;
    }

    if (!finalFileUrl) {
      return res.status(400).json({
        success: false,
        message: "Unable to create report image",
      });
    }

    // create report
    const newReport = await Report.create({
      hospitalId: finalHospitalId,
      patientId,
      doctorId,
      appointmentId,
      medicineId,
      testId,
      labId: finalLabId,
      reportName: reportName.trim(),
      reportType: reportType.trim(),
      reportDate: reportDate ? new Date(reportDate) : new Date(),
      fileUrl: finalFileUrl,
      publicId: finalPublicId,
      fileName: finalFileName,
      sampleType: sampleType ? sampleType.trim() : "",
      result: result ? result.trim() : "",
      resultValue: resultValue ? resultValue.trim() : "",
      normalRange: normalRange ? normalRange.trim() : "",
      unit: unit ? unit.trim() : "",
      impression: impression ? impression.trim() : "",
      advice: advice ? advice.trim() : "",
      technicianName: technicianName ? technicianName.trim() : "",
      verifiedBy: verifiedBy ? verifiedBy.trim() : "",
      remarks: remarks ? remarks.trim() : "",
      status: status || "verified",
    });

    if (medicineId && testId) {
      await Medicine.updateOne(
        {
          _id: medicineId,
          "tests.testId": testId,
        },
        {
          $set: {
            "tests.$.status": "completed",
          },
        },
      );
    }

    return res.status(201).json({
      success: true,
      message: "Report created successfully",
      data: newReport,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// get all reports
exports.getAllReports = async (req, res) => {
  try {
    const filter = {};

    if (req.user && req.user.role === "user") {
      filter.patientId = req.user._id || req.user.id;
    }

    if (req.user && (req.user.role === "hospital" || req.user.role === "admin" || req.user.role === "lab")) {
      const loginUser = await User.findById(req.user._id || req.user.id);

      if (loginUser && loginUser.hospitalId) {
        filter.hospitalId = loginUser.hospitalId;
      }

      if (req.user.role === "lab" && loginUser && loginUser.labId) {
        filter.labId = loginUser.labId;
      }
    }

    if (req.user && req.user.role === "doctor") {
      const loginUser = await User.findById(req.user._id || req.user.id);
      let doctor = null;

      if (loginUser && loginUser.doctorId) {
        doctor = await Doctor.findById(loginUser.doctorId);
      }

      if (!doctor && loginUser) {
        doctor = await Doctor.findOne({ email: loginUser.email });
      }

      if (doctor) {
        filter.doctorId = doctor._id;
      }
    }

    const reports = await Report.find(filter)
      .populate("hospitalId")
      .populate("patientId", "-password -otp -otpExpire")
      .populate("doctorId")
      .populate("appointmentId")
      .populate("testId")
      .populate("labId")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Reports fetched successfully",
      count: reports.length,
      data: reports,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// get one report
exports.getOneReport = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await Report.findById(id)
      .populate("hospitalId")
      .populate("patientId", "-password -otp -otpExpire")
      .populate("doctorId")
      .populate("appointmentId")
      .populate("testId")
      .populate("labId");

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Report fetched successfully",
      data: report,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// get single report
exports.getSingleReport = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await Report.findById(id)
      .populate("hospitalId")
      .populate("patientId", "-password -otp -otpExpire")
      .populate("doctorId")
      .populate("appointmentId")
      .populate("testId")
      .populate("labId");

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Report fetched successfully",
      data: report,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// update report
exports.updateReport = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      hospitalId,
      patientId,
      doctorId,
      appointmentId,
      medicineId,
      testId,
      labId,
      reportName,
      reportType,
      reportDate,
      sampleType,
      result,
      resultValue,
      normalRange,
      unit,
      impression,
      advice,
      technicianName,
      verifiedBy,
      fileUrl,
      publicId,
      fileName,
      remarks,
      status,
    } = req.body;

    // check report exists
    const existingReport = await Report.findById(id);

    if (!existingReport) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    // update report
    const updatedReport = await Report.findByIdAndUpdate(
      id,
      {
        hospitalId: hospitalId || existingReport.hospitalId,
        patientId: patientId || existingReport.patientId,
        doctorId: doctorId || existingReport.doctorId,
        appointmentId: appointmentId || existingReport.appointmentId,
        medicineId: medicineId || existingReport.medicineId,
        testId: testId || existingReport.testId,
        labId: labId || existingReport.labId,
        reportName: reportName ? reportName.trim() : existingReport.reportName,
        reportType: reportType ? reportType.trim() : existingReport.reportType,
        reportDate: reportDate ? new Date(reportDate) : existingReport.reportDate,
        fileUrl: fileUrl || existingReport.fileUrl,
        publicId: publicId !== undefined ? publicId : existingReport.publicId,
        fileName: fileName !== undefined ? fileName : existingReport.fileName,
        sampleType: sampleType !== undefined ? sampleType.trim() : existingReport.sampleType,
        result: result !== undefined ? result.trim() : existingReport.result,
        resultValue: resultValue !== undefined ? resultValue.trim() : existingReport.resultValue,
        normalRange: normalRange !== undefined ? normalRange.trim() : existingReport.normalRange,
        unit: unit !== undefined ? unit.trim() : existingReport.unit,
        impression: impression !== undefined ? impression.trim() : existingReport.impression,
        advice: advice !== undefined ? advice.trim() : existingReport.advice,
        technicianName: technicianName !== undefined ? technicianName.trim() : existingReport.technicianName,
        verifiedBy: verifiedBy !== undefined ? verifiedBy.trim() : existingReport.verifiedBy,
        remarks: remarks !== undefined ? remarks.trim() : existingReport.remarks,
        status: status || existingReport.status,
      },
      {
        new: true,
      },
    );

    return res.status(200).json({
      success: true,
      message: "Report updated successfully",
      data: updatedReport,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// delete report
exports.deleteReport = async (req, res) => {
  try {
    const { id } = req.params;

    const existingReport = await Report.findById(id);

    if (!existingReport) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    await Report.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Report deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};
