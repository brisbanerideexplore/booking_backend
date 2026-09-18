const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const crypto = require("crypto");
const Booking = require("../models/Booking");
const Rate = require("../models/Rate");
const { getDrivingDistanceAndTime } = require("../utils/mapbox");
const { calculateFare } = require("../utils/fareCalculator");
const { sendCustomerConfirmation, sendAdminNotification } = require("../utils/mailer");

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

function validateBookingFields(body) {
  const {
    name, email, phone, passengers, pickupDate, pickupTime,
    pickupAddress, destinationAddress, vehicle,
  } = body;

  if (
    !name || !email || !phone || !passengers || !pickupDate || !pickupTime ||
    !pickupAddress || !destinationAddress || !vehicle
  ) {
    return "Missing required booking fields.";
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Please enter a valid email address.";
  }

  return null;
}

router.post("/create-checkout-session", async (req, res) => {
  try {
    const {
      name, email, phone, passengers, luggage, pickupDate, pickupTime,
      pickupAddress, pickupLat, pickupLng,
      destinationAddress, destLat, destLng,
      vehicle, distanceKm, durationMin, fare,
      childSeat, childSeatFee,
    } = req.body;

    const validationError = validateBookingFields(req.body);
    if (validationError || !fare) {
      return res.status(400).json({ error: validationError || "Missing required booking fields." });
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
        name, email, phone,
        passengers: String(passengers),
        luggage: String(luggage || 0),
        pickupDate, pickupTime, pickupAddress,
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

// Cash booking — fare is RECALCULATED server-side, never trusted from the client.
router.post("/book-cash", async (req, res) => {
  try {
    const {
      name, email, phone, passengers, luggage, pickupDate, pickupTime,
      pickupAddress, pickupLat, pickupLng,
      destinationAddress, destLat, destLng,
      vehicle, childSeat,
    } = req.body;

    const validationError = validateBookingFields(req.body);
    if (validationError) return res.status(400).json({ error: validationError });

    if (!pickupLat || !pickupLng || !destLat || !destLng) {
      return res.status(400).json({ error: "Missing pickup or destination coordinates." });
    }

    const rate = await Rate.findOne({ vehicle });
    if (!rate) {
      return res.status(404).json({ error: `No rate configured for vehicle: ${vehicle}` });
    }

    // Server calculates distance/duration itself — client-sent values are ignored.
    const { distanceKm, durationMin } = await getDrivingDistanceAndTime(
      pickupLat, pickupLng, destLat, destLng
    );

    // Server calculates the fare itself, using the same trusted logic as /calculate-fare.
    const { fare, childSeatFee } = calculateFare(rate, distanceKm, durationMin, childSeat);

    const cashSessionId = `cash_${crypto.randomUUID()}`;

    const booking = await Booking.create({
      name, email, phone,
      passengers: Number(passengers),
      luggage: Number(luggage || 0),
      pickupDate, pickupTime,
      pickupAddress,
      pickupLat: Number(pickupLat),
      pickupLng: Number(pickupLng),
      destinationAddress,
      destLat: Number(destLat),
      destLng: Number(destLng),
      vehicle,
      distanceKm,
      durationMin,
      fare,
      childSeat: !!childSeat,
      childSeatFee,
      paymentMethod: "cash",
      stripeSessionId: cashSessionId,
      paymentStatus: "pending",
    });

    try {
      await sendCustomerConfirmation(booking);
      await sendAdminNotification(booking);
    } catch (mailErr) {
      console.error("Failed to send cash booking emails:", mailErr);
    }

    res.json({ sessionId: cashSessionId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to book the ride." });
  }
});

router.get("/booking-by-session/:sessionId", async (req, res) => {
  try {
    const booking = await Booking.findOne({ stripeSessionId: req.params.sessionId });
    if (!booking) return res.status(404).json({ error: "Booking not found." });
    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch booking." });
  }
});

module.exports = router;