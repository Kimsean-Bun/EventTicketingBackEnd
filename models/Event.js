const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  description: { type: String },
  category:    { type: String },
  venue:       { type: String },
  date: {
    type: Date,
    required: [true, 'Date is required'],
  },
  time: { type: String },
  seatCapacity: {
    type: Number,
    required: [true, 'Seat capacity is required'],
    min: [1, 'Seat capacity must be greater than 0'],
  },
  bookedSeats: {
    type: Number,
    default: 0,
    min: [0, 'Booked seats cannot be negative'],
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
  },
}, { timestamps: true });

// Virtual: seats still available
eventSchema.virtual('availableSeats').get(function () {
  return this.seatCapacity - this.bookedSeats;
});

module.exports = mongoose.model('Event', eventSchema);
