const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(express.json());

const defaultOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://medicore-vijay-dinodia.onrender.com",
];

const envOrigins = process.env.FRONTEND_URLS
  ? process.env.FRONTEND_URLS.split(",").map((origin) => origin.trim())
  : [];

const allowedOrigins = [...defaultOrigins, ...envOrigins];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
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
const labRoute = require("./routes/labRoute");
const testRoute = require("./routes/testRoute");
const reportRoute = require("./routes/reportRoute");

app.use("/user", userRoute);
app.use("/location", locationRoute);
app.use("/hospital", hospitalRoute);
app.use("/super-admin", superAdminRoute);
app.use("/department", departmentRoute);
app.use("/sub-department", subDepartmentRoute);
app.use("/doctor", doctorRoute);
app.use("/appointment", appointmentRoute);
app.use("/medicine", medicineRoute);
app.use("/lab", labRoute);
app.use("/test", testRoute);
app.use("/report", reportRoute);

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log("server is running on port", port);
});