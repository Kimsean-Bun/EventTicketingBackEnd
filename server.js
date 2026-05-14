const express = require('express');
const dotenv  = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
app.use(express.json());

// Root — simple HTML welcome page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head><title>Event Ticketing API</title></head>
      <body>
        <h1>🎟️ Event Ticketing System API</h1>
        <p>API is running.</p>
        <p>Base URL: <code>/api</code></p>
        <ul>
          <li>POST /api/auth/register</li>
          <li>POST /api/auth/login</li>
          <li>GET  /api/events</li>
          <li>POST /api/bookings</li>
          <li>GET  /api/admin/dashboard</li>
        </ul>
      </body>
    </html>
  `);
});

// Routes
app.use('/api/auth',     require('./routes/authRoutes'));
app.use('/api/events',   require('./routes/eventRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/admin',    require('./routes/adminRoutes'));

// 404 handler — must come after all routes
app.use((req, res) => {
  const acceptsHTML = req.headers['accept']?.includes('text/html');
  if (acceptsHTML) {
    res.status(404).send(`
      <!DOCTYPE html>
      <html>
        <head><title>404 Not Found</title></head>
        <body><h1>404 – Page Not Found</h1></body>
      </html>
    `);
  } else {
    res.status(404).json({ error: '404 Not Found' });
  }
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);

  // Mongoose validation errors return 400 instead of 500
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));