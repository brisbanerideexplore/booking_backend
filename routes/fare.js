const express = require("express");
const router = express.Router();
const Rate = require("../models/Rate");
const { getDrivingDistanceAndTime } = require("../utils/mapbox");
const { calculateFare } = require("../utils/fareCalculator");

router.post("/calculate-fare", async (req, res) => {
  try {
    const { originLat, originLng, destLat, destLng, vehicle, childSeat } = req.body;

    if (!originLat || !originLng || !destLat || !destLng || !vehicle) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const rate = await Rate.findOne({ vehicle });
    if (!rate) {
      return res.status(404).json({ error: `No rate configured for vehicle: ${vehicle}` });
    }

    const { distanceKm, durationMin } = await getDrivingDistanceAndTime(
      originLat, originLng, destLat, destLng
    );

    const result = calculateFare(rate, distanceKm, durationMin, childSeat);
    res.json(result);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to calculate fare." });
  }
});

module.exports = router;