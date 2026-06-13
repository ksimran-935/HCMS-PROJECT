const express = require('express');
const router = express.Router();
const {
  register,
  verifyRegisterOTP,
  login,
  verifyLoginOTP,
  forgotPassword,
  resetPassword,
  getMe,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// POST /api/auth/register  (Step 1: validate fields, send OTP)
router.post('/register', register);

// POST /api/auth/register/verify-otp  (Step 2: verify OTP, create account)
router.post('/register/verify-otp', verifyRegisterOTP);

// POST /api/auth/login  (Step 1: validate credentials, send login OTP)
router.post('/login', login);

// POST /api/auth/login/verify-otp  (Step 2: verify OTP, receive JWT)
router.post('/login/verify-otp', verifyLoginOTP);

// POST /api/auth/forgot-password
router.post('/forgot-password', forgotPassword);

// POST /api/auth/reset-password
router.post('/reset-password', resetPassword);

// GET /api/auth/me
router.get('/me', protect, getMe);

module.exports = router;
