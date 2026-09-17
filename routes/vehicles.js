const express = require("express");
const router = express.Router();
const Rate = require("../models/Rate");

router.get("/", async (req, res) => {
  const rates = await Rate.find({}, "vehicle tagline").sort({ vehicle: 1 });
  res.json(rates);
});

module.exports = router;