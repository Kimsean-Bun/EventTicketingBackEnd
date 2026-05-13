const express = require('express');
const router  = express.Router();
const { getDashboard } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// GET /api/admin/dashboard — admin only
router.get('/dashboard', protect, adminOnly, getDashboard);

module.exports = router;