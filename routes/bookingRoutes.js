const express = require('express');
const router  = express.Router();
const {
  getMyBookings, getBookingById, createBooking, validateQr,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

// IMPORTANT: /validate/:qr must be defined BEFORE /:id
// otherwise Express will treat "validate" as a booking ID
router.get('/validate/:qr', validateQr);

// All other booking routes require authentication
router.get('/',    protect, getMyBookings);
router.get('/:id', protect, getBookingById);
router.post('/',   protect, createBooking);

module.exports = router;