const Event   = require('../models/Event');
const Booking = require('../models/Booking');
const User    = require('../models/User');

// GET /api/admin/dashboard
// BONUS: Returns a summary of all events with their booking lists and metrics.
// Only accessible by admins. Useful for monitoring event performance.
const getDashboard = async (req, res, next) => {
  try {
    // Aggregate totals across the entire system
    const totalEvents   = await Event.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const totalUsers    = await User.countDocuments({ role: 'user' });

    // For each event, fetch its bookings and the users who made them.
    // populate() on 'user' gives us name + email for each booking.
    const events = await Event.find().sort({ date: 1 });

    const eventsWithBookings = await Promise.all(
      events.map(async (event) => {
        const bookings = await Booking.find({ event: event._id })
          .populate('user', 'name email');

        // Calculate total tickets sold for this specific event
        const ticketsSold = bookings.reduce((sum, b) => sum + b.quantity, 0);

        return {
          _id:          event._id,
          title:        event.title,
          category:     event.category,
          venue:        event.venue,
          date:         event.date,
          seatCapacity: event.seatCapacity,
          bookedSeats:  event.bookedSeats,
          availableSeats: event.seatCapacity - event.bookedSeats,
          ticketsSold,
          revenue:      ticketsSold * event.price,
          bookings: bookings.map(b => ({
            bookingId:   b._id,
            user:        b.user,
            quantity:    b.quantity,
            bookingDate: b.bookingDate,
          })),
        };
      })
    );

    res.json({
      summary: {
        totalEvents,
        totalBookings,
        totalUsers,
        // Total revenue across all events
        totalRevenue: eventsWithBookings.reduce((sum, e) => sum + e.revenue, 0),
      },
      events: eventsWithBookings,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboard };