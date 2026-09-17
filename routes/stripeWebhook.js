const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const Booking = require("../models/Booking");
const { sendCustomerConfirmation, sendAdminNotification } = require("../utils/mailer");

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

router.post("/", express.raw({ type: "application/json" }), async (req, res) => {
  let event;

  try {
    const signature = req.headers["stripe-signature"];
    event = stripe.webhooks.constructEvent(req.body, signature, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const m = session.metadata;

    try {
      const booking = await Booking.create({
        name: m.name,
        email: m.email,
        phone: m.phone,
        passengers: Number(m.passengers),
        luggage: Number(m.luggage || 0),
        pickupDate: m.pickupDate,
        pickupTime: m.pickupTime,
        pickupAddress: m.pickupAddress,
        pickupLat: Number(m.pickupLat),
        pickupLng: Number(m.pickupLng),
        destinationAddress: m.destinationAddress,
        destLat: Number(m.destLat),
        destLng: Number(m.destLng),
        vehicle: m.vehicle,
        distanceKm: Number(m.distanceKm),
        durationMin: Number(m.durationMin),
        childSeat: m.childSeat === "true",
        childSeatFee: Number(m.childSeatFee || 0),
        fare: Number(m.fare),
        stripeSessionId: session.id,
        stripePaymentIntentId: session.payment_intent,
        paymentStatus: "paid",
        paidAt: new Date(),
      });

      try {
        await sendCustomerConfirmation(booking);
        await sendAdminNotification(booking);
      } catch (mailErr) {
        console.error("Failed to send booking emails:", mailErr);
      }

    } catch (err) {
      if (err.code !== 11000) {
        console.error("Failed to create booking after payment:", err);
      }
    }
  }

  res.json({ received: true });
});

module.exports = router;