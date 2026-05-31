const mongoose = require("mongoose");

const medicalStoreSchema = new mongoose.Schema(
  {
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
    },

    cityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "City",
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null,
    },

    medicalName: {
      type: String,
      required: true,
      trim: true,
    },

    medicalCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
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
      trim: true,
    },

    address: {
      type: String,
      default: "",
      trim: true,
    },

    pincode: {
      type: String,
      default: "",
      trim: true,
    },

    inChargeName: {
      type: String,
      default: "",
      trim: true,
    },

    licenseNumber: {
      type: String,
      default: "",
      trim: true,
    },

    openingTime: {
      type: String,
      default: "",
    },

    closingTime: {
      type: String,
      default: "",
    },

    deliveryAvailable: {
      type: Boolean,
      default: false,
    },

    emergencyAvailable: {
      type: Boolean,
      default: false,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

module.exports = mongoose.model("MedicalStore", medicalStoreSchema);
