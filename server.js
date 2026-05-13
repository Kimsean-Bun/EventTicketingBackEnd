const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const path = require('path');

const app = express();
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'public')));

// Root — serve the frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Routes
app.use('/api/auth',     require('./routes/authRoutes'));
app.use('/api/events',   require('./routes/eventRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/admin',    require('./routes/adminRoutes'));  // BONUS: admin dashboard

// 404 middleware — must come after all routes
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

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));