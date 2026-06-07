const express = require('express');
const router = express.Router();
const {
  register,
  login,
  verifyLoginOTP,
  forgotPassword,
  resetPassword,
  getMe,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login  (Step 1: validate credentials, send login OTP)
router.post('/login', login);

// POST /api/auth/login/verify-otp  (Step 2: verify OTP, receive JWT)
router.post('/login/verify-otp', verifyLoginOTP);

// POST /api/auth/forgot-password  (email OTP for password reset)
router.post('/forgot-password', forgotPassword);

// POST /api/auth/reset-password   (email OTP for password reset)
router.post('/reset-password', resetPassword);

// GET /api/auth/me
router.get('/me', protect, getMe);

module.exports = router;
