const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    // Regex ensures standard email format (user@domain.ext)
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    // Note: plain-text password is hashed in the pre-save hook below
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user', // all new accounts are regular users unless explicitly set
  },
}, { timestamps: true });

// Pre-save hook: hash the password before writing to MongoDB.
// isModified check prevents double-hashing on unrelated document updates.
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10); // salt rounds = 10 (industry standard)
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method: compare a plain-text candidate password to the stored hash.
// Called during login — bcrypt.compare handles the hashing internally.
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);