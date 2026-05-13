const QRCode  = require('qrcode');
const Booking = require('../models/Booking');
const Event   = require('../models/Event');

// GET /api/bookings
// Returns only the bookings that belong to the currently logged-in user.
// populate() replaces the event ObjectId with the actual event document fields.
const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('event', 'title date venue price');
    res.json(bookings);
  } catch (err) {
    next(err);
  }
};

// GET /api/bookings/:id
// Returns a single booking but enforces ownership — users cannot access
// bookings that belong to other accounts (returns 403 if mismatched).
const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('event', 'title date venue price');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Convert ObjectIds to strings before comparing to avoid reference mismatch
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to view this booking' });
    }

    res.json(booking);
  } catch (err) {
    next(err);
  }
};

// POST /api/bookings
// Creates a new booking after validating seat availability.
// bookedSeats is incremented on the Event document to keep capacity accurate.
const createBooking = async (req, res, next) => {
  try {
    const { event: eventId, quantity } = req.body;

    if (!eventId)  return res.status(400).json({ error: 'Event ID is required' });
    if (!quantity || quantity < 1) {
      return res.status(400).json({ error: 'Quantity must be at least 1' });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Calculate remaining seats and reject if not enough are available
    const availableSeats = event.seatCapacity - event.bookedSeats;
    if (quantity > availableSeats) {
      return res.status(400).json({
        error: `Only ${availableSeats} seat(s) available`,
      });
    }

    // Save the booking record
    const booking = await Booking.create({
      user:     req.user._id,
      event:    eventId,
      quantity,
    });

    // Update the event's bookedSeats count to reflect the new reservation
    event.bookedSeats += quantity;
    await event.save();

    // BONUS: Generate a QR code encoding the booking ID as a base64 data URL.
    // This serves as a scannable ticket the user can save or screenshot.
    const qrData = `booking:${booking._id}`;
    const qrCode = await QRCode.toDataURL(qrData);

    // Store the generated QR code back on the booking document
    booking.qrCode = qrCode;
    await booking.save();

    res.status(201).json(booking);
  } catch (err) {
    next(err);
  }
};

// GET /api/bookings/validate/:qr
// BONUS: Validates a booking by its ID (extracted from the QR code string).
// Returns the booking details if found, confirming the ticket is legitimate.
const validateQr = async (req, res, next) => {
  try {
    const bookingId = req.params.qr;

    // Look up the booking and populate event + user info for full ticket details
    const booking = await Booking.findById(bookingId)
      .populate('event', 'title date venue time price')
      .populate('user',  'name email');

    if (!booking) {
      return res.status(404).json({ error: 'Invalid QR code — booking not found' });
    }

    res.json({
      valid:   true,
      booking: {
        _id:         booking._id,
        user:        booking.user,
        event:       booking.event,
        quantity:    booking.quantity,
        bookingDate: booking.bookingDate,
      },
    });
  } catch (err) {
    // Invalid ObjectId format will land here
    return res.status(400).json({ error: 'Invalid QR code format' });
  }
};

module.exports = { getMyBookings, getBookingById, createBooking, validateQr };