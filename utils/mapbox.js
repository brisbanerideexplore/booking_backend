async function getDrivingDistanceAndTime(originLat, originLng, destLat, destLng) {
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${originLng},${originLat};${destLng},${destLat}?access_token=${process.env.MAPBOX_TOKEN}`;

  const response = await fetch(url);
  const data = await response.json();

  if (!data.routes || data.routes.length === 0) {
    throw new Error("No route found between these two addresses.");
  }

  const distanceKm = data.routes[0].distance / 1000;
  const durationMin = data.routes[0].duration / 60;

  return { distanceKm, durationMin };
}

module.exports = { getDrivingDistanceAndTime };