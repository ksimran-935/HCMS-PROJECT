const express = require('express');
const router = express.Router();
const { submitComplaint, getMyComplaints } = require('../controllers/complaintController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// POST /api/complaints — Submit new complaint (students only)
router.post('/', protect, authorizeRoles('student'), submitComplaint);

// GET /api/complaints/my — Get logged-in student's own complaints
router.get('/my', protect, authorizeRoles('student'), getMyComplaints);

module.exports = router;
