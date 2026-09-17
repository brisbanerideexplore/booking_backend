// This is a reference for wiring the new routes into your existing
// server.js. The ORDER below matters — the Stripe webhook route
// must be mounted BEFORE express.json(), because it needs the raw,
// unparsed request body to verify Stripe's signature. If express.json()
// runs first, the webhook will fail signature verification.

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

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

// 1. Webhook FIRST, with express.raw (not express.json)
app.use("/webhook", require("./routes/stripeWebhook"));

// 2. THEN express.json() for every other route
app.use(express.json());

// 3. Your existing + new routes
app.use("/api", require("./routes/fare"));      // existing fare calculator route
app.use("/api", require("./routes/checkout"));  // new: create-checkout-session, booking-by-session

// Admin + public vehicles routes
app.use("/api/admin", require("./routes/adminAuth"));      // POST /api/admin/login
app.use("/api/admin/rates", require("./routes/adminRates"));
app.use("/api/admin/bookings", require("./routes/adminBookings"));
app.use("/api/vehicles", require("./routes/vehicles"));    // public, used by VehicleSelector

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));