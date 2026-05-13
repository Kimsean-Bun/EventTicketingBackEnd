const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
  },
  bookingDate: {
    type: Date,
    default: Date.now,
  },
  qrCode: {
    type: String, // base64 string (bonus feature)
  },
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
