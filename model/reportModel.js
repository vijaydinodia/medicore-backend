const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
    },

    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },

    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
    },

    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Medicine",
    },

    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Test",
    },

    labId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Labs",
    },

    reportName: {
      type: String,
      required: true,
      trim: true,
    },

    reportType: {
      type: String,
      required: true,
      trim: true,
    },

    reportDate: {
      type: Date,
      default: Date.now,
    },

    fileUrl: {
      type: String,
      required: true,
    },

    publicId: {
      type: String,
      default: "",
    },

    fileName: {
      type: String,
      default: "",
    },

    sampleType: {
      type: String,
      default: "",
    },

    result: {
      type: String,
      default: "",
    },

    resultValue: {
      type: String,
      default: "",
    },

    normalRange: {
      type: String,
      default: "",
    },

    unit: {
      type: String,
      default: "",
    },

    impression: {
      type: String,
      default: "",
    },

    advice: {
      type: String,
      default: "",
    },

    technicianName: {
      type: String,
      default: "",
    },

    verifiedBy: {
      type: String,
      default: "",
    },

    remarks: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

module.exports = mongoose.model("Report", reportSchema);
