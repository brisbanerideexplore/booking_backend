const mongoose = require("mongoose");

const rateSchema = new mongoose.Schema({
  vehicle: { type: String, required: true, unique: true },
  tagline: { type: String, default: "" },
  baseFare: { type: Number, required: true },
  perKm: { type: Number, required: true },
  tierThresholdKm: { type: Number, default: 0 },      // 0 = no tiering, flat perKm applies
  perKmAfterThreshold: { type: Number, default: 0 },  // rate used beyond tierThresholdKm
  perMin: { type: Number, required: true },
  minFare: { type: Number, default: 0 }
});

module.exports = mongoose.model("Rate", rateSchema);