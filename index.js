console.log("🔥 THIS INDEX FILE IS RUNNING 🔥");

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./src/routes/authRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// 🔴 ADD THIS TEST ROUTE
app.post("/ping", (req, res) => {
  res.json({ message: "Ping working" });
});

// Auth routes
app.use("/api/auth", authRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
