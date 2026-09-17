const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const requireAdmin = require("../middleware/requireAdmin");

router.use(requireAdmin);

router.get("/", async (req, res) => {
  const bookings = await Booking.find().sort({ createdAt: -1 });
  res.json(bookings);
});

module.exports = router;