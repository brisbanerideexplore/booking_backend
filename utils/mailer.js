const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function formatBookingDetails(booking) {
  const isCash = booking.paymentMethod === "cash";
  const fareLabel = isCash ? "Fare due (pay driver in cash)" : "Fare paid";

  return `
    <table style="width:100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 14px;">
      <tr><td style="padding:6px 0; color:#666;">Pickup</td><td style="padding:6px 0;"><strong>${booking.pickupAddress}</strong></td></tr>
      <tr><td style="padding:6px 0; color:#666;">Destination</td><td style="padding:6px 0;"><strong>${booking.destinationAddress}</strong></td></tr>
      <tr><td style="padding:6px 0; color:#666;">Passengers</td><td style="padding:6px 0;"><strong>${booking.passengers}</strong></td></tr>
      <tr><td style="padding:6px 0; color:#666;">Luggage</td><td style="padding:6px 0;"><strong>${booking.luggage}</strong></td></tr>
      <tr><td style="padding:6px 0; color:#666;">Pickup date</td><td style="padding:6px 0;"><strong>${booking.pickupDate}</strong></td></tr>
      <tr><td style="padding:6px 0; color:#666;">Pickup time</td><td style="padding:6px 0;"><strong>${booking.pickupTime}</strong></td></tr>
      <tr><td style="padding:6px 0; color:#666;">Vehicle</td><td style="padding:6px 0;"><strong>${booking.vehicle}</strong></td></tr>
      <tr><td style="padding:6px 0; color:#666;">Distance</td><td style="padding:6px 0;"><strong>${booking.distanceKm} km</strong></td></tr>
      <tr><td style="padding:6px 0; color:#666;">Drive time</td><td style="padding:6px 0;"><strong>${Math.round(booking.durationMin)} min</strong></td></tr>
      ${booking.childSeat ? `<tr><td style="padding:6px 0; color:#666;">Child seat</td><td style="padding:6px 0;"><strong>Yes (+$${booking.childSeatFee.toFixed(2)})</strong></td></tr>` : ""}
      <tr><td style="padding:6px 0; color:#666;">Payment method</td><td style="padding:6px 0;"><strong>${isCash ? "Cash (pay driver)" : "Card (paid online)"}</strong></td></tr>
      <tr><td style="padding:6px 0; color:#666;">${fareLabel}</td><td style="padding:6px 0;"><strong>$${booking.fare.toFixed(2)}</strong></td></tr>
      <tr><td style="padding:6px 0; color:#666;">Booking ref</td><td style="padding:6px 0;"><strong>${booking.stripeSessionId}</strong></td></tr>
    </table>
  `;
}

async function sendCustomerConfirmation(booking) {
  await transporter.sendMail({
    from: `"Brizzy Ride & Explore" <${process.env.EMAIL_USER}>`,
    to: booking.email,
    subject: "Your booking is confirmed — Brizzy Ride & Explore",
    html: `
      <div style="font-family: Arial, sans-serif; max-width:520px; margin:0 auto;">
        <h2 style="color:#1B4A46;">Booking confirmed!</h2>
        <p>Congratulations, ${booking.name}! Your ride booking is confirmed — we'll see you for your <strong>${booking.vehicle}</strong> ride, and we'll be in touch on <strong>${booking.phone}</strong> if needed. Here are your trip details:</p>
        ${formatBookingDetails(booking)}
        <p style="margin-top:20px; color:#666; font-size:13px;">If you have any questions about your ride, just reply to this email.</p>
      </div>
    `,
  });
}

async function sendAdminNotification(booking) {
  await transporter.sendMail({
    from: `"Brizzy Booking System" <${process.env.EMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL,
    subject: `New booking — ${booking.name} — $${booking.fare.toFixed(2)}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width:520px; margin:0 auto;">
        <h2 style="color:#1B4A46;">New ride booked</h2>
        <p>A new ride has just been booked and paid for. Visit the admin page to view the full ride details.</p>
        <p><strong>${booking.name}</strong> (${booking.email}, ${booking.phone})</p>
        ${formatBookingDetails(booking)}
      </div>
    `,
  });
}

module.exports = { sendCustomerConfirmation, sendAdminNotification };