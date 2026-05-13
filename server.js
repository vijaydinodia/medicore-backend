const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
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

app.use("/user", userRoute);
app.use("/location", locationRoute);
app.use("/hospital", hospitalRoute);
app.use("/super-admin", superAdminRoute);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log("server is running on port", port);
});
