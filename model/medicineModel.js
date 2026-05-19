const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
    },

    symptoms: {
      type: String,
      default: "",
    },

    diagnosis: {
      type: String,
      default: "",
    },

    bloodPressure: {
      type: String,
      default: "",
    },

    temperature: {
      type: String,
      default: "",
    },

    weight: {
      type: String,
      default: "",
    },

    nextVisitDate: {
      type: Date,
    },

    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
    },

    medicines: [
      {
        medicineName: {
          type: String,
          default: "",
        },

        dosage: {
          type: String,
          default: "",
        },

        timing: {
          type: String,
          default: "",
        },

        days: {
          type: Number,
          default: 1,
        },

        instruction: {
          type: String,
          default: "",
        },

        morning: {
          type: Boolean,
          default: false,
        },

        afternoon: {
          type: Boolean,
          default: false,
        },

        night: {
          type: Boolean,
          default: false,
        },

        beforeFood: {
          type: Boolean,
          default: false,
        },

        afterFood: {
          type: Boolean,
          default: false,
        },
      },
    ],

    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

module.exports = mongoose.model("Medicine", medicineSchema);