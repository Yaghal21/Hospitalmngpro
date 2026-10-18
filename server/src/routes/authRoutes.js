const express = require('express');
const router = express.Router();
const { register, login, logout, getMe } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many authentication attempts, please try again later'
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);

module.exports = router;
