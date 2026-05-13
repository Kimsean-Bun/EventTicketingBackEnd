const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// Helper: generate a signed JWT containing the user's MongoDB _id.
// The token is used by the client on all protected requests.
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// POST /api/auth/register
// Creates a new user account. Password hashing happens in the User pre-save hook,
// not here, to keep this controller clean and avoid handling raw passwords directly.
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Reject duplicate emails early with a clear message
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const user = await User.create({ name, email, password, role });

    // Return user info and a token so the client can authenticate immediately
    res.status(201).json({
      _id:   user._id,
      name:  user.name,
      email: user.email,
      role:  user.role,
      token: generateToken(user._id),
    });
  } catch (err) {
    next(err); // pass to centralized error handler
  }
};

// POST /api/auth/login
// Validates credentials and returns a JWT on success.
// Uses a generic error message for both bad email and bad password
// to avoid leaking which one was wrong (security best practice).
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });

    // matchPassword uses bcrypt.compare internally — never compare plain text
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json({
      _id:   user._id,
      name:  user.name,
      email: user.email,
      role:  user.role,
      token: generateToken(user._id),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login };