const mongoose = require("mongoose");

const testSchema = new mongoose.Schema(
  {
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
    },

    labId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Labs",
      required: true,
    },

    testName: {
      type: String,
      required: true,
      trim: true,
    },

    testCode: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    category: {
      type: String,
      default: "",
    },

    sampleType: {
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

    amount: {
      type: Number,
      default: 0,
    },

    reportTime: {
      type: String,
      default: "",
    },

    instructions: {
      type: String,
      default: "",
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

module.exports = mongoose.model("Test", testSchema);
