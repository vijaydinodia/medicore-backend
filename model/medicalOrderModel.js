const mongoose = require("mongoose");

const medicalOrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
    },

    medicalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Medical",
      required: true,
    },

    medicalStoreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MedicalStore",
      default: null,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ["placed", "ready", "completed", "cancelled"],
      default: "placed",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

module.exports = mongoose.model("MedicalOrder", medicalOrderSchema);
