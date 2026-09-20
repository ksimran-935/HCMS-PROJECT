const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendPasswordResetEmail } = require('../utils/emailService');

// Generate JWT token
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// ─────────────────────────────────────────────────────────────
// @desc    Register — create account immediately, return JWT
// @route   POST /api/auth/register
// @access  Public
// ─────────────────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { name, email, password, role, phone, roomNo, department } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: 'Name, email, password, and role are required',
      });
    }

    if (!['student', 'admin', 'staff'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role selected' });
    }

    const allowedDepts = [
      'Electricity', 'Water', 'Cleanliness', 'Internet', 'Room Maintenance', 'Other',
    ];
    if (role === 'staff' && (!department || !allowedDepts.includes(department))) {
      return res.status(400).json({
        message: 'Maintenance staff must select a valid department',
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({
        message: 'Email already registered. Please use a different email.',
      });
    }

    const userData = {
      name: name.trim(),
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
    console.error('Register error:', error.message);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(' ') });
    }
    res.status(500).json({ message: error.message || 'Server error during registration' });
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Login — validate credentials & issue JWT immediately
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

    if (user.role !== role) {
      return res.status(401).json({
        message: `No ${role} account found with this email. Please select the correct role.`,
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

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
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Forgot password — generate token, email reset link
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

    // Generate a random raw token (32 bytes → 64 hex chars)
    const rawToken = crypto.randomBytes(32).toString('hex');

    // Hash the token before storing in DB
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Store hash + 30-min expiry
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
    await user.save({ validateBeforeSave: false });

    // Build the reset URL using the raw (unhashed) token
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password?token=${rawToken}`;

    const emailSent = await sendPasswordResetEmail(cleanEmail, user.name, resetUrl);

    if (!emailSent) {
      // Roll back token so user can try again
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({
        message: 'Failed to send reset email. Please check SMTP configuration.',
      });
    }

    res.status(200).json({
      message: 'Password reset link sent to your email. Valid for 30 minutes.',
    });
  } catch (error) {
    console.error('Forgot password error:', error.message);
    res.status(500).json({ message: 'Server error during password reset request', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Reset password — verify token, update password
// @route   POST /api/auth/reset-password
// @access  Public
// ─────────────────────────────────────────────────────────────
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Hash the incoming raw token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with matching hashed token that hasn't expired
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message: 'Reset link is invalid or has expired. Please request a new one.',
      });
    }

    // Update password and clear reset token fields
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
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
  login,
  forgotPassword,
  resetPassword,
  getMe,
};