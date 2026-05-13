const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// protect middleware: verifies the JWT token sent in the Authorization header.
// If valid, it attaches the full user document (minus password) to req.user
// so downstream route handlers can identify who is making the request.
const protect = async (req, res, next) => {
  let token;

  // Tokens must arrive as: Authorization: Bearer <token>
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized, no token' });
  }

  try {
    // jwt.verify throws if the token is expired or tampered with
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch the user and exclude the password field from the result
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ error: 'User no longer exists' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Not authorized, token invalid' });
  }
};

// adminOnly middleware: must be used after protect.
// Checks that the authenticated user has the 'admin' role.
// Regular users attempting admin routes receive a 403 Forbidden response.
const adminOnly = (req, res, next) => {
  if (req.user?.role === 'admin') {
    return next();
  }
  return res.status(403).json({ error: 'Access denied: admins only' });
};

module.exports = { protect, adminOnly };