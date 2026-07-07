const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
require("dotenv").config();

const { applySecurity, globalErrorHandler } = require("./middleware/security");
const {
  globalLimiter,
  authLimiter,
  apiLimiter,
} = require("./middleware/rateLimiter");

const app = express();

app.set("trust proxy", 1);

applySecurity(app);

app.use(morgan("short"));

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));


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
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(globalLimiter);

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
const medicalRoute = require("./routes/medicalRoute");
const labRoute = require("./routes/labRoute");
const testRoute = require("./routes/testRoute");
const reportRoute = require("./routes/reportRoute");
const statReportRoute = require("./routes/statReportRoute");
const receptionistRoute = require("./routes/receptionistRoute");


app.use("/user", authLimiter, userRoute);


app.use("/location", apiLimiter, locationRoute);
app.use("/hospital", apiLimiter, hospitalRoute);
app.use("/super-admin", apiLimiter, superAdminRoute);
app.use("/department", apiLimiter, departmentRoute);
app.use("/sub-department", apiLimiter, subDepartmentRoute);
app.use("/doctor", apiLimiter, doctorRoute);
app.use("/appointment", apiLimiter, appointmentRoute);
app.use("/medicine", apiLimiter, medicineRoute);
app.use("/medical", apiLimiter, medicalRoute);
app.use("/lab", apiLimiter, labRoute);
app.use("/test", apiLimiter, testRoute);
app.use("/report", apiLimiter, reportRoute);
app.use("/stat-report", apiLimiter, statReportRoute);
app.use("/receptionist", apiLimiter, receptionistRoute);


app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});


app.use(globalErrorHandler);

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log("server is running on port", port);
});
