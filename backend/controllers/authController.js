const jwt = require('jsonwebtoken');
const User = require('../models/User');
const {
  sendRegisterOTPEmail,
  sendResetOTPEmail,
  sendLoginOTPEmail,
} = require('../utils/emailService');

// Generate JWT token
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// ─────────────────────────────────────────────────────────────
// @desc    Register Step 1 — validate fields, send OTP email
// @route   POST /api/auth/register
// @access  Public
// ─────────────────────────────────────────────────────────────
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
      'Electricity', 'Water', 'Cleanliness', 'Internet', 'Room Maintenance', 'Other',
    ];
    if (role === 'staff' && (!department || !allowedDepts.includes(department))) {
      return res.status(400).json({
        message: 'Maintenance staff must select a valid department',
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check duplicate email
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({
        message: 'Email already registered. Please use a different email.',
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    if (existingUser && !existingUser.isVerified) {
      // Update existing unverified entry with fresh OTP and new data
      existingUser.name = name.trim();
      existingUser.password = password;
      existingUser.role = role;
      existingUser.phone = phone || '';
      existingUser.roomNo = role === 'student' ? (roomNo || '') : '';
      existingUser.department = role === 'staff' ? department : '';
      existingUser.registerOTP = otp;
      existingUser.registerOTPExpires = otpExpires;
      await existingUser.save();
    } else {
      // Create new unverified user
      const userData = {
        name: name.trim(),
        email: cleanEmail,
        password,
        role,
        phone: phone || '',
        isVerified: false,
        registerOTP: otp,
        registerOTPExpires: otpExpires,
      };
      if (role === 'student') userData.roomNo = roomNo || '';
      if (role === 'staff') userData.department = department;
      await User.create(userData);
    }

    // Send OTP email
    const emailSent = await sendRegisterOTPEmail(cleanEmail, otp, name.trim());
    if (!emailSent) {
      return res.status(500).json({
        message: 'Failed to send OTP email. Please check SMTP configuration.',
      });
    }

    res.status(200).json({
      message: `OTP sent to ${cleanEmail}. Please verify your email to complete registration.`,
      otpRequired: true,
      email: cleanEmail,
    });
  } catch (error) {
    console.error('Register error:', error.message);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(' ') });
    }
    res.status(500).json({ message: error.message || 'Server error during registration' });
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Register Step 2 — verify OTP, activate account
// @route   POST /api/auth/register/verify-otp
// @access  Public
// ─────────────────────────────────────────────────────────────
const verifyRegisterOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({ message: 'No pending registration found for this email.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Account already verified. Please log in.' });
    }

    if (
      !user.registerOTP ||
      user.registerOTP !== otp ||
      !user.registerOTPExpires ||
      user.registerOTPExpires < Date.now()
    ) {
      return res.status(400).json({ message: 'Invalid or expired OTP. Please try again.' });
    }

    // Activate account
    user.isVerified = true;
    user.registerOTP = '';
    user.registerOTPExpires = undefined;
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Registration successful! Welcome to HCMS.',
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
    console.error('Verify register OTP error:', error.message);
    res.status(500).json({ message: 'Server error during OTP verification', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Login Step 1 — validate credentials & send OTP
// @route   POST /api/auth/login
// @access  Public
// ─────────────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Email, password, and role are required' });
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

    // isVerified === false means pending OTP verification (new accounts)
    // isVerified === undefined means legacy account created before this field existed — allow login
    if (user.isVerified === false) {
      return res.status(403).json({
        message: 'Email not verified. Please complete the registration OTP step.',
      });
    }

    if (user.role !== role) {
      return res.status(401).json({
        message: `No ${role} account found with this email. Please select the correct role.`,
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate login OTP
    const otp = generateOTP();
    user.loginOTP = otp;
    user.loginOTPExpires = Date.now() + 10 * 60 * 1000;
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

// ─────────────────────────────────────────────────────────────
// @desc    Login Step 2 — verify OTP & issue JWT
// @route   POST /api/auth/login/verify-otp
// @access  Public
// ─────────────────────────────────────────────────────────────
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

    // Clear login OTP
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

// ─────────────────────────────────────────────────────────────
// @desc    Send password reset OTP via email
// @route   POST /api/auth/forgot-password
// @access  Public
// ─────────────────────────────────────────────────────────────
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

    const otp = generateOTP();
    user.passwordResetOTP = otp;
    user.passwordResetOTPExpires = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const emailSent = await sendResetOTPEmail(cleanEmail, otp);
    if (!emailSent) {
      return res.status(500).json({
        message: 'OTP generated but failed to send email. Check MAIL_USER, MAIL_PASS in .env.',
      });
    }

    res.status(200).json({
      message: 'OTP sent to your registered email address. Please check your inbox.',
    });
  } catch (error) {
    console.error('Forgot password error:', error.message);
    res.status(500).json({ message: 'Server error during password reset request', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Reset password with OTP
// @route   POST /api/auth/reset-password
// @access  Public
// ─────────────────────────────────────────────────────────────
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({ message: 'No account found with this email.' });
    }

    if (
      !user.passwordResetOTP ||
      user.passwordResetOTP !== otp ||
      !user.passwordResetOTPExpires ||
      user.passwordResetOTPExpires < Date.now()
    ) {
      return res.status(400).json({ message: 'Invalid or expired OTP. Please request a new one.' });
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
    res.status(500).json({ message: 'Server error during password reset', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
// ─────────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({ user });
  } catch (error) {
    console.error('GetMe error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  register,
  verifyRegisterOTP,
  login,
  verifyLoginOTP,
  forgotPassword,
  resetPassword,
  getMe,
};