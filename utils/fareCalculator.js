const CHILD_SEAT_FEE = 25;

function calculateFare(rate, distanceKm, durationMin, childSeat) {
  let distanceCost;

  if (rate.tierThresholdKm && distanceKm > rate.tierThresholdKm) {
    const tierKm = rate.tierThresholdKm;
    const remainingKm = distanceKm - tierKm;
    distanceCost = (tierKm * rate.perKm) + (remainingKm * rate.perKmAfterThreshold);
  } else {
    distanceCost = distanceKm * rate.perKm;
  }

  let fare = rate.baseFare + distanceCost + (durationMin * rate.perMin);
  if (rate.minFare && fare < rate.minFare) {
    fare = rate.minFare;
  }

  const childSeatFee = childSeat ? CHILD_SEAT_FEE : 0;
  fare += childSeatFee;

  return {
    distanceKm: Number(distanceKm.toFixed(2)),
    durationMin: Number(durationMin.toFixed(1)),
    childSeat: !!childSeat,
    childSeatFee,
    fare: Number(fare.toFixed(2)),
  };
}

module.exports = { calculateFare, CHILD_SEAT_FEE };