const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
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

    subDepartmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubDepartment",
      default: null,
    },

    doctorName: {
      type: String,
      required: true,
      trim: true,
    },

    doctorCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    alternatePhone: {
      type: String,
      default: "",
    },

    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },

    dateOfBirth: {
      type: Date,
    },

    specialization: {
      type: String,
      required: true,
      trim: true,
    },

    qualification: {
      type: String,
      required: true,
      trim: true,
    },

    experience: {
      type: Number,
      default: 0,
    },

    consultationFee: {
      type: Number,
      default: 0,
    },

    licenseNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    bloodGroup: {
      type: String,
      default: "",
    },

    address: {
      type: String,
      default: "",
      trim: true,
    },

    stateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "State",
    },

    districtId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "District",
    },

    cityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "City",
    },

    pincode: {
      type: String,
      default: "",
    },

    profileImage: {
      type: String,
      default: "",
    },

    doctorImage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DoctorImg",
      default: null,
    },

    files: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DoctorImg",
      },
    ],

    availableDays: [
      {
        type: String,
      },
    ],

    availableTime: {
      startTime: {
        type: String,
        default: "",
      },

      endTime: {
        type: String,
        default: "",
      },
    },

    emergencyAvailable: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["active", "inactive", "on-leave"],
      default: "active",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Doctor", doctorSchema);
