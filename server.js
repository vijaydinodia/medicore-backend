const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
require("dotenv").config();

const app = express();

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://medicore-vijay-dinodia.onrender.com",
    ],
    credentials: true,
  })
);

// MongoDB
mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => console.log("Database Connected"))
  .catch((err) => console.log(err));

// Routes
app.use("/hospital", require("./routes/hospitalRoute"));
app.use("/user", require("./routes/userRoute"));
// Add your other routes here...

// Root Route
app.get("/", (req, res) => {
  res.send("Server Running");
});

// 404
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));