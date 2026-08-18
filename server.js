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

app.set("trust proxy", 1)

// Security
applySecurity(app);

// Logger
app.use(morgan("short"));

// Body Parser
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// CORS - Allow All Origins
const corsOptions = {
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.options("*", cors(corsOptions));
app.use(cors(corsOptions));

// Rate Limiter
app.use(globalLimiter);

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URL)
  .then(function () {
    console.log("Database Connected");
  })
  .catch(function (err) {
    console.log(err);
  });

// Routes
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

// Health Route
app.get("/health", (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatusMap = { 0: "disconnected", 1: "connected", 2: "connecting", 3: "disconnecting" };

  res.status(200).json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    database: {
      status: dbStatusMap[dbState] || "unknown",
      connected: dbState === 1,
    },
    memory: {
      heapUsed: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB`,
      rss: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`,
    },
  });
});

// Default Route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Server is Running",
  });
});

// 404 Route
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global Error Handler
app.use(globalErrorHandler);

// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});