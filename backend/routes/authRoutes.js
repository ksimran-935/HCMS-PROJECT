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

// GET /api/auth/test-smtp  ← TEMPORARY: diagnose SMTP issues, remove after fixing
router.get('/test-smtp', async (req, res) => {
  const nodemailer = require('nodemailer');
  const host = process.env.MAIL_HOST;
  const user = process.env.MAIL_USER;
  const pass = process.env.MAIL_PASS;
  const port = parseInt(process.env.MAIL_PORT, 10) || 587;
  const secure = process.env.MAIL_SECURE === 'true';

  // Report what env vars are present
  const config = {
    MAIL_HOST: host || '❌ MISSING',
    MAIL_PORT: process.env.MAIL_PORT || '❌ MISSING (defaulting to 587)',
    MAIL_SECURE: process.env.MAIL_SECURE || '❌ MISSING (defaulting to false)',
    MAIL_USER: user ? `✅ set (${user})` : '❌ MISSING',
    MAIL_PASS: pass ? `✅ set (length: ${pass.length})` : '❌ MISSING',
    MAIL_FROM: process.env.MAIL_FROM || '❌ MISSING',
  };

  if (!host || !user || !pass) {
    return res.status(500).json({ status: 'SMTP not configured', config });
  }

  const transporter = nodemailer.createTransport({
    host, port, secure, auth: { user, pass },
    connectionTimeout: 10000,
    socketTimeout: 10000,
  });

  try {
    await transporter.verify();
    res.json({ status: '✅ SMTP connection successful!', config });
  } catch (err) {
    res.status(500).json({ status: '❌ SMTP connection failed', error: err.message, config });
  }
});

module.exports = router;
