const express = require('express');
const router = express.Router();
const { getAssignedComplaints, updateComplaintStatus } = require('../controllers/staffController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// All staff routes are protected and staff-only
router.use(protect, authorizeRoles('staff'));

// GET /api/staff/complaints
router.get('/complaints', getAssignedComplaints);

// PUT /api/staff/complaints/:id/status
router.put('/complaints/:id/status', updateComplaintStatus);

module.exports = router;
