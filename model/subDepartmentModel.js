const mongoose = require("mongoose");

const subDepartmentSchema = new mongoose.Schema(
  {
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
    },

    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "department",
      required: true,
    },

    subDepartmentName: {
      type: String,
      required: true,
      trim: true,
    },

    subDepartmentCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    headOfSubDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null,
    },

    totalDoctors: {
      type: Number,
      default: 0,
    },

    totalStaff: {
      type: Number,
      default: 0,
    },

    consultationFee: {
      type: Number,
      default: 0,
    },

    roomNumber: {
      type: String,
      default: "",
    },

    timings: {
      openingTime: {
        type: String,
        default: "",
      },

      closingTime: {
        type: String,
        default: "",
      },
    },

    services: [
      {
        type: String,
      },
    ],

    isEmergencyAvailable: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("SubDepartment", subDepartmentSchema);
