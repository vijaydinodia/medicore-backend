const mongoose = require("mongoose");

const doctorImgSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
    required: true,
  },

  profileImage: {
    type: String,
    default: "",
  },

  url: {
    type: String,
    default: "",
  },

  publicId: {
    type: String,
    default: "",
  },

  name: {
    type: String,
    default: "",
  },

  type: {
    type: String,
    default: "",
  },

  category: {
    type: String,
    enum: ["profile", "image", "file"],
    default: "profile",
  },
});

module.exports = mongoose.model("DoctorImg", doctorImgSchema);
