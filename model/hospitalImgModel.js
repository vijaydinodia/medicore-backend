const mongoose = require("mongoose");

const hospitalImgSchema = new mongoose.Schema(
  {
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
    },

    url: {
      type: String,
      required: true,
    },

    publicId: {
      type: String,
      default: "",
    },

    name: {
      type: String,
      default: "",
    },

    documentName: {
      type: String,
      default: "",
    },

    category: {
      type: String,
      enum: ["image", "document"],
      default: "image",
    },

    type: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

module.exports = mongoose.model("HospitalImg", hospitalImgSchema);
