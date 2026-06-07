const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');

// --------------- Nodemailer Setup ---------------

/**
 * Build a Gmail SMTP transporter on each call so it always uses
 * the current process.env values (important after hot-reloads).
 */
const getMailTransport = () => {
  const host = process.env.MAIL_HOST;
  const user = process.env.MAIL_USER;
  const pass = process.env.MAIL_PASS;

  if (!host || !user || !pass ||
      user === 'your_gmail@gmail.com' ||
      pass === 'your_16_char_app_password') {
    return null;  // not configured
  }

  return nodemailer.createTransport({
    host,
    port: parseInt(process.env.MAIL_PORT, 10) || 587,
    secure: process.env.MAIL_SECURE === 'true',
    auth: { user, pass },
  });
};

const sendResetOTPEmail = async (to, otp) => {
  const transport = getMailTransport();

  if (!transport) {
    console.error('❌ SMTP not configured — check MAIL_HOST, MAIL_USER, MAIL_PASS in .env');
    console.error('   Current values → HOST:', process.env.MAIL_HOST, '| USER:', process.env.MAIL_USER, '| PASS length:', process.env.MAIL_PASS?.length);
    return false;
  }

  const from    = process.env.MAIL_FROM || 'HCMS <no-reply@hcms.com>';
  const subject = 'HCMS Password Reset OTP';
  const text    = `Your HCMS password reset code is: ${otp}\n\nThis code will expire in 10 minutes.`;
  const html    = `
    <div style="font-family: Arial, sans-serif; color: #1f2937; max-width: 480px; margin: auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px;">
      <h2 style="color: #5b21b6; margin-bottom: 8px;">HCMS Password Reset</h2>
      <p style="color: #6b7280; margin-bottom: 24px;">You requested a password reset. Use the OTP below to proceed.</p>
      <div style="background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
        <p style="font-size: 2rem; font-weight: 700; letter-spacing: 0.5rem; color: #5b21b6; margin: 0;">${otp}</p>
      </div>
      <p style="font-size: 0.85rem; color: #9ca3af;">This code expires in <strong>10 minutes</strong>. If you did not request this, please ignore this email.</p>
    </div>
  `;

  try {
    await transport.sendMail({ from, to, subject, text, html });
    console.log(`✅ OTP email sent to ${to}`);
    return true;
  } catch (err) {
    console.error('❌ SMTP sendMail failed:');
    console.error('   Code   :', err.code);
    console.error('   Message:', err.message);
    if (err.response) console.error('   SMTP Response:', err.response);
    return false;
  }
};

const sendLoginOTPEmail = async (to, otp, name) => {
  const transport = getMailTransport();

  if (!transport) {
    console.error('❌ SMTP not configured — check MAIL_HOST, MAIL_USER, MAIL_PASS in .env');
    return false;
  }

  const from    = process.env.MAIL_FROM || 'HCMS <no-reply@hcms.com>';
  const subject = 'HCMS Login OTP';
  const text    = `Hello ${name},\n\nYour HCMS login OTP is: ${otp}\n\nThis code expires in 10 minutes.`;
  const html    = `
    <div style="font-family: Arial, sans-serif; color: #1f2937; max-width: 480px; margin: auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px;">
      <h2 style="color: #5b21b6; margin-bottom: 8px;">HCMS Login Verification</h2>
      <p style="color: #6b7280; margin-bottom: 4px;">Hello <strong>${name}</strong>,</p>
      <p style="color: #6b7280; margin-bottom: 24px;">Use the OTP below to complete your login.</p>
      <div style="background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
        <p style="font-size: 2rem; font-weight: 700; letter-spacing: 0.5rem; color: #5b21b6; margin: 0;">${otp}</p>
      </div>
      <p style="font-size: 0.85rem; color: #9ca3af;">This code expires in <strong>10 minutes</strong>. If you did not attempt to log in, please ignore this email.</p>
    </div>
  `;

  try {
    await transport.sendMail({ from, to, subject, text, html });
    console.log(`✅ Login OTP email sent to ${to}`);
    return true;
  } catch (err) {
    console.error('❌ SMTP sendMail (login OTP) failed:');
    console.error('   Code   :', err.code);
    console.error('   Message:', err.message);
    if (err.response) console.error('   SMTP Response:', err.response);
    return false;
  }
};

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// @desc    Register a new user (student / admin / staff)
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password, role, phone, roomNo, department } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: 'Name, email, password, and role are required',
      });
    }

    // Validate role
    if (!['student', 'admin', 'staff'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role selected' });
    }

    // Staff must select a department
    const allowedDepts = [
      'Electricity',
      'Water',
      'Cleanliness',
      'Internet',
      'Room Maintenance',
      'Other',
    ];

    if (
      role === 'staff' &&
      (!department || !allowedDepts.includes(department))
    ) {
      return res.status(400).json({
        message: 'Maintenance staff must select a valid department',
      });
    }

    // NITJ Email Validation
    const cleanEmail = email.trim().toLowerCase();

    const emailRegex = /^[a-zA-Z0-9._%+-]+@nitj\.ac\.in$/;

    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        message: 'Only NIT Jalandhar official email is allowed',
      });
    }

    // Check duplicate email
    const existingUser = await User.findOne({ email: cleanEmail });

    if (existingUser) {
      return res.status(400).json({
        message: 'Email already registered. Please use a different email.',
      });
    }

    // Build user data based on role
    const userData = {
      name,
      email: cleanEmail,
      password,
      role,
      phone: phone || '',
    };

    if (role === 'student') userData.roomNo = roomNo || '';
    if (role === 'staff') userData.department = department;

    const user = await User.create(userData);

    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        roomNo: user.roomNo || '',
        department: user.department || '',
      },
    });
  } catch (error) {
    console.error('Register error:', error.message);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        message: messages.join(' '),
      });
    }

    res.status(500).json({
      message: error.message || 'Server error during registration',
    });
  }
};

// @desc    Login Step 1 — validate credentials & send OTP
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        message: 'Email, password, and role are required',
      });
    }

    if (!['student', 'admin', 'staff'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role selected' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail }).select('+password');

    if (!user) {
      return res.status(404).json({
        message: 'No account found with this email. Please register first.',
      });
    }

    if (user.role !== role) {
      return res.status(401).json({
        message: `No ${role} account found with this email. Please select the correct role or register as ${role}.`,
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Credentials verified — generate login OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.loginOTP = otp;
    user.loginOTPExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save({ validateBeforeSave: false });

    const emailSent = await sendLoginOTPEmail(cleanEmail, otp, user.name);

    if (!emailSent) {
      return res.status(500).json({
        message: 'Credentials verified but OTP email failed. Check SMTP config in .env.',
      });
    }

    res.status(200).json({
      message: `OTP sent to ${cleanEmail}. Please check your inbox.`,
      otpRequired: true,
      email: cleanEmail,
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

// @desc    Login Step 2 — verify OTP & issue JWT
// @route   POST /api/auth/login/verify-otp
// @access  Public
const verifyLoginOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({ message: 'No account found with this email.' });
    }

    if (
      !user.loginOTP ||
      user.loginOTP !== otp ||
      !user.loginOTPExpires ||
      user.loginOTPExpires < Date.now()
    ) {
      return res.status(400).json({ message: 'Invalid or expired OTP. Please try again.' });
    }

    // Clear login OTP after use
    user.loginOTP = '';
    user.loginOTPExpires = undefined;
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        roomNo: user.roomNo,
        department: user.department,
      },
    });
  } catch (error) {
    console.error('Verify login OTP error:', error.message);
    res.status(500).json({ message: 'Server error during OTP verification', error: error.message });
  }
};

// @desc    Send password reset OTP via email
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({
        message: 'No account found with this email. Please register first.',
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.passwordResetOTP = otp;
    user.passwordResetOTPExpires = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const emailSent = await sendResetOTPEmail(cleanEmail, otp);

    if (!emailSent) {
      return res.status(500).json({
        message: 'OTP generated but failed to send email. Check MAIL_USER, MAIL_PASS in .env and restart the server.',
      });
    }

    res.status(200).json({
      message: 'OTP sent to your registered email address. Please check your inbox.',
    });
  } catch (error) {
    console.error('Forgot password error:', error.message);

    res.status(500).json({
      message: 'Server error during password reset request',
      error: error.message,
    });
  }
};

// @desc    Reset password with email OTP
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        message: 'Email, OTP, and new password are required',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({
        message: 'No account found with this email. Please register first.',
      });
    }

    if (
      !user.passwordResetOTP ||
      user.passwordResetOTP !== otp ||
      !user.passwordResetOTPExpires ||
      user.passwordResetOTPExpires < Date.now()
    ) {
      return res.status(400).json({
        message: 'Invalid or expired OTP. Please request a new one.',
      });
    }

    user.password = newPassword;
    user.passwordResetOTP = '';
    user.passwordResetOTPExpires = undefined;
    await user.save();

    res.status(200).json({
      message: 'Password reset successful. You can now sign in with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error.message);

    res.status(500).json({
      message: 'Server error during password reset',
      error: error.message,
    });
  }
};

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('GetMe error:', error.message);

    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
};

module.exports = { register, login, verifyLoginOTP, forgotPassword, resetPassword, getMe };