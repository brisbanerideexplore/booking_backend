const mongoose = require("mongoose");

const rateSchema = new mongoose.Schema({
  vehicle: { type: String, required: true, unique: true },
  tagline: { type: String, default: "" },   // ← add this line
  baseFare: { type: Number, required: true },
  perKm: { type: Number, required: true },
  perMin: { type: Number, required: true },
  minFare: { type: Number, default: 0 }
});

module.exports = mongoose.model("Rate", rateSchema);