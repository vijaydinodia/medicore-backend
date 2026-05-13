const mongoose = require("mongoose");

const stateModel = new mongoose.Schema(
  {
    stateName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      required: true,
    },
    country: {
      type: String,
      default: "India",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

module.exports = mongoose.model("State", stateModel);
