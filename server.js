const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  }),
);

mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => console.log("Db is connected"))
  .catch((err) => console.log(err));

const userRoute = require("./routes/userRoute");
const locationRoute = require("./routes/locationRoute");
const hospitalRoute = require("./routes/hospitalRoute");
const superAdminRoute = require("./routes/superAdminRoute");
const departmentRoute = require("./routes/departmentRoute");
const subDepartmentRoute = require("./routes/subDepartmentRoute");
const doctorRoute = require("./routes/doctorRoute");
const appointmentRoute = require("./routes/appointmentRoute");
const medicineRoute = require("./routes/medicineRoute");

app.use("/user", userRoute);
app.use("/location", locationRoute);
app.use("/hospital", hospitalRoute);
app.use("/super-admin", superAdminRoute);
app.use("/department", departmentRoute);
app.use("/sub-department", subDepartmentRoute);
app.use("/doctor", doctorRoute);
app.use("/appointment", appointmentRoute);
app.use("/medicine", medicineRoute);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log("server is running on port", port);
});
