// Verify that all new files and modified files can be successfully imported without syntax errors
try {
  console.log("Checking receptionist model...");
  const Receptionist = require("./model/receptionistModel");
  console.log("Receptionist model imported successfully.");

  console.log("Checking receptionist mail template...");
  const mailTemplate = require("./templates/receptionistMailTemplate");
  console.log("Mail template imported successfully.");

  console.log("Checking receptionist controller...");
  const controller = require("./controller/receptionistController");
  console.log("Receptionist controller imported successfully.");

  console.log("Checking receptionist routes...");
  const routes = require("./routes/receptionistRoute");
  console.log("Receptionist routes imported successfully.");

  console.log("Checking user model...");
  const User = require("./model/userModel");
  console.log("User model imported successfully.");

  console.log("Checking user controller...");
  const userController = require("./controller/userController");
  console.log("User controller imported successfully.");

  console.log("Checking server.js registration...");
  const express = require("express");
  const app = express();
  app.use("/receptionist", routes);
  console.log("Server registration simulated successfully.");

  console.log("Checking appointment model...");
  const Appointment = require("./model/appointmentModel");
  console.log("Appointment model imported successfully.");

  console.log("Checking appointment routes and controllers...");
  const appointmentRoutes = require("./routes/appointmentRoute");
  console.log("Appointment routes/controllers imported successfully.");

  console.log("\nALL SYNTAX AND IMPORT CHECKS PASSED!");
  process.exit(0);
} catch (error) {
  console.error("Syntax or import error encountered:", error);
  process.exit(1);
}
