const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema(
  {
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
    },
    departmentName: {
      type: String,
      required: true,
      trim: true,
    },
    departmentCode: {
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

    headOfDepartment: {
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
    facilities: [
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
    versionKey: false,
  },
);

module.exports = mongoose.model("department", departmentSchema);
