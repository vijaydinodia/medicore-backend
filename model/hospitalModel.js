const mongoose = require("mongoose");

const hospitalSchema = new mongoose.Schema(
  {
    hospitalName: {
      type: String,
      required: true,
      trim: true,
    },

    hospitalCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    hospitalType: {
      type: String,
      enum: ["Government", "Private", "Trust"],
      required: true,
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
      unique: true,
      trim: true,
    },

    alternatePhone: {
      type: String,
      trim: true,
    },

    website: {
      type: String,
      trim: true,
    },

    registrationNumber: {
      type: String,
      required: true,
      unique: true,
    },

    establishedYear: {
      type: Number,
    },

    stateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "State",
      required: true,
    },

    districtId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "District",
      required: true,
    },

    cityId: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: "City",
      required: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    pincode: {
      type: String,
      required: true,
      trim: true,
    },

    totalBeds: {
      type: Number,
      default: 0,
    },

    availableBeds: {
      type: Number,
      default: 0,
    },

    totalDoctors: {
      type: Number,
      default: 0,
    },

    totalStaff: {
      type: Number,
      default: 0,
    },

    emergencyAvailable: {
      type: Boolean,
      default: false,
    },

    ambulanceAvailable: {
      type: Boolean,
      default: false,
    },

    ICUAvailable: {
      type: Boolean,
      default: false,
    },

    bloodBankAvailable: {
      type: Boolean,
      default: false,
    },

    pharmacyAvailable: {
      type: Boolean,
      default: false,
    },

    logo: {
      type: String,
    },

    description: {
      type: String,
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "inactive"],
      default: "pending",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

module.exports = mongoose.model("Hospital", hospitalSchema);
