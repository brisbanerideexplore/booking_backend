const express = require("express");
const router = express.Router();
const Rate = require("../models/Rate");
const { getDrivingDistanceAndTime } = require("../utils/mapbox");

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

    let fare = rate.baseFare + (distanceKm * rate.perKm) + (durationMin * rate.perMin);
    if (rate.minFare && fare < rate.minFare) {
      fare = rate.minFare;
    }

    const CHILD_SEAT_FEE = 25;
    const childSeatFee = childSeat ? CHILD_SEAT_FEE : 0;
    fare += childSeatFee;

    res.json({
      distanceKm: Number(distanceKm.toFixed(2)),
      durationMin: Number(durationMin.toFixed(1)),
      childSeat: !!childSeat,
      childSeatFee,
      fare: Number(fare.toFixed(2))
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to calculate fare." });
  }
});

module.exports = router;