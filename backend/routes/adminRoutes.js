const express = require('express');
const router = express.Router();
const {
  getAllComplaints,
  getAnalytics,
  getAllStudents,
  getAllStaff,
  assignComplaint,
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// All admin routes are protected and admin-only
router.use(protect, authorizeRoles('admin'));

// GET /api/admin/complaints
router.get('/complaints', getAllComplaints);

// GET /api/admin/analytics
router.get('/analytics', getAnalytics);

// GET /api/admin/students
router.get('/students', getAllStudents);

// GET /api/admin/staff
router.get('/staff', getAllStaff);

// PUT /api/admin/complaints/:id/assign
router.put('/complaints/:id/assign', assignComplaint);

module.exports = router;
