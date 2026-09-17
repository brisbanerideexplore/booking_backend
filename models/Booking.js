const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true }, // full number incl. country code, e.g. +61412345678

  pickupAddress: { type: String, required: true },
  pickupLat: { type: Number, required: true },
  pickupLng: { type: Number, required: true },

  passengers: { type: Number, required: true },
  luggage: { type: Number, default: 0 },
  pickupDate: { type: String, required: true },
  pickupTime: { type: String, required: true },

  destinationAddress: { type: String, required: true },
  destLat: { type: Number, required: true },
  destLng: { type: Number, required: true },

  vehicle: { type: String, required: true },
  distanceKm: { type: Number, required: true },
  durationMin: { type: Number, required: true },
  fare: { type: Number, required: true },
  currency: { type: String, default: "aud" },

  childSeat: { type: Boolean, default: false },
  childSeatFee: { type: Number, default: 0 },

  stripeSessionId: { type: String, required: true, unique: true },
  stripePaymentIntentId: { type: String },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed"],
    default: "pending",
  },

  createdAt: { type: Date, default: Date.now },
  paidAt: { type: Date },
});

module.exports = mongoose.model("Booking", bookingSchema);