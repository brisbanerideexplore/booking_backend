const express = require("express");
const router = express.Router();
const Rate = require("../models/Rate");
const requireAdmin = require("../middleware/requireAdmin");

router.use(requireAdmin); // every route below requires a valid admin token

router.get("/", async (req, res) => {
  const rates = await Rate.find().sort({ vehicle: 1 });
  res.json(rates);
});

router.post("/", async (req, res) => {
  try {
    const { vehicle, tagline, baseFare, perKm, perMin, minFare } = req.body;
    if (!vehicle || baseFare == null || perKm == null || perMin == null) {
      return res.status(400).json({ error: "Missing required fields." });
    }
    const rate = await Rate.create({ vehicle, tagline, baseFare, perKm, perMin, minFare: minFare || 0 });
    res.status(201).json(rate);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: "That vehicle already exists." });
    console.error(err);
    res.status(500).json({ error: "Failed to add vehicle." });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { tagline, baseFare, perKm, perMin, minFare } = req.body;
    const rate = await Rate.findByIdAndUpdate(
      req.params.id,
      { tagline, baseFare, perKm, perMin, minFare },
      { new: true, runValidators: true }
    );
    if (!rate) return res.status(404).json({ error: "Vehicle not found." });
    res.json(rate);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update vehicle." });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const rate = await Rate.findByIdAndDelete(req.params.id);
    if (!rate) return res.status(404).json({ error: "Vehicle not found." });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to remove vehicle." });
  }
});

module.exports = router;