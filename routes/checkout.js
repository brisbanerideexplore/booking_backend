const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const Booking = require("../models/Booking");

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

router.post("/create-checkout-session", async (req, res) => {
  try {


    const {
      name, email, phone, passengers, luggage, pickupDate, pickupTime,
      pickupAddress, pickupLat, pickupLng,
      destinationAddress, destLat, destLng,
      vehicle, distanceKm, durationMin, fare,
      childSeat, childSeatFee,
    } = req.body;

    if (
      !name || !email || !phone || !passengers || !pickupDate || !pickupTime ||
      !pickupAddress || !destinationAddress ||
      !vehicle || !fare
    ) {
      return res.status(400).json({ error: "Missing required booking fields." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Please enter a valid email address." });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "aud",
            unit_amount: Math.round(fare * 100),
            product_data: {
              name: `${vehicle} ride — ${pickupAddress} to ${destinationAddress}${childSeat ? " (+ child seat)" : ""}`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        name,
        email,
        phone,
        passengers: String(passengers),
        luggage: String(luggage || 0),
        pickupDate,
        pickupTime,
        pickupAddress,
        pickupLat: String(pickupLat),
        pickupLng: String(pickupLng),
        destinationAddress,
        destLat: String(destLat),
        destLng: String(destLng),
        vehicle,
        distanceKm: String(distanceKm),
        durationMin: String(durationMin),
        fare: String(fare),
        childSeat: String(!!childSeat),
        childSeatFee: String(childSeatFee || 0),
      },
      success_url: `${process.env.CLIENT_URL}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/booking-cancelled`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to start checkout." });
  }
});

router.get("/booking-by-session/:sessionId", async (req, res) => {
  try {
    const booking = await Booking.findOne({
      stripeSessionId: req.params.sessionId,
    });
    if (!booking) {
      return res.status(404).json({ error: "Booking not found." });
    }
    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch booking." });
  }
});

module.exports = router;