require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

// Route imports
const authRoutes = require('./routes/authRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const adminRoutes = require('./routes/adminRoutes');
const staffRoutes = require('./routes/staffRoutes');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000'];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
  allowedOrigins.push(process.env.FRONTEND_URL.replace(/\/$/, ''));
}

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'HCMS API is running ', version: '1.0.0' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/staff', staffRoutes);

// 404 and Error handlers
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(` HCMS Server running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
});
