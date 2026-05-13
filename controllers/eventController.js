const Event = require('../models/Event');

// GET /api/events
// Returns all events, sorted by date ascending.
// Supports optional query filters: ?category=music and/or ?date=YYYY-MM-DD
const getEvents = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.category) {
      // Case-insensitive regex so "Music" and "music" both match
      filter.category = { $regex: req.query.category, $options: 'i' };
    }

    if (req.query.date) {
      // Build a date range covering the full calendar day (midnight to midnight)
      const start = new Date(req.query.date);
      const end   = new Date(req.query.date);
      end.setDate(end.getDate() + 1);
      filter.date = { $gte: start, $lt: end };
    }

    const events = await Event.find(filter).sort({ date: 1 });
    res.json(events);
  } catch (err) {
    next(err);
  }
};

// GET /api/events/:id
// Returns a single event by its MongoDB _id
const getEventById = async (req, res, next) => {
  try {
    // Validate that the id is a proper MongoDB ObjectId before querying
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid event ID format' });
    }

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
  } catch (err) {
    next(err);
  }
};

// POST /api/events  (admin only)
// Creates a new event. Validation is handled by the Mongoose schema.
const createEvent = async (req, res, next) => {
  try {
    const event = await Event.create(req.body);
    res.status(201).json(event);
  } catch (err) {
    next(err);
  }
};

// PUT /api/events/:id  (admin only)
// Updates any field on an event except _id.
// Prevents reducing seatCapacity below the number of already-booked seats
// to avoid creating an overbooking situation.
const updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Guard: new seatCapacity must not fall below already-booked seats
    if (
      req.body.seatCapacity !== undefined &&
      req.body.seatCapacity < event.bookedSeats
    ) {
      return res.status(400).json({
        error: `Cannot set seatCapacity below bookedSeats (${event.bookedSeats})`,
      });
    }

    // Strip _id from the body to prevent accidental overwrite of the document id
    delete req.body._id;

    const updated = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true } // runValidators re-applies schema rules on update
    );
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/events/:id  (admin only)
// Deletion policy: if any bookings exist for this event, deletion is blocked.
// This protects users who have already reserved tickets.
// The admin must ensure all bookings are resolved before deleting the event.
const deleteEvent = async (req, res, next) => {
  try {
    const Booking = require('../models/Booking');
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Count bookings referencing this event
    const bookingCount = await Booking.countDocuments({ event: req.params.id });
    if (bookingCount > 0) {
      return res.status(400).json({
        error: `Cannot delete event with ${bookingCount} existing booking(s). Cancel bookings first.`,
      });
    }

    await event.deleteOne();
    res.json({ message: 'Event deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getEvents, getEventById, createEvent, updateEvent, deleteEvent };