const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./utils/db");

const app = express();

const allowedOrigins = [
  "https://book.brisbanerideexplore.com",
  "https://booking-frontend-samad22.vercel.app",
  "https://booking-frontend-git-main-samad22.vercel.app",
  "http://localhost:5173"
];

app.use(cors({ origin: function (origin, callback) {
  if (!origin || allowedOrigins.includes(origin)) {
    callback(null, true);
  } else {
    callback(new Error("Not allowed by CORS")); } }, credentials: true }));

// Ensure a DB connection exists before ANY route runs.
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("Database connection failed:", err);
    res.status(500).json({ error: "Database connection failed. Please try again." });
  }
});

// 1. Webhook FIRST, with express.raw (not express.json)
app.use("/webhook", require("./routes/stripeWebhook"));

// 2. THEN express.json() for every other route
app.use(express.json());

// 3. Your existing + new routes
app.use("/api", require("./routes/fare"));
app.use("/api", require("./routes/checkout"));

app.use("/api/admin", require("./routes/adminAuth"));
app.use("/api/admin/rates", require("./routes/adminRates"));
app.use("/api/admin/bookings", require("./routes/adminBookings"));
app.use("/api/vehicles", require("./routes/vehicles"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;