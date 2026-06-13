const Complaint = require('../models/Complaint');
const { sendComplaintStatusEmail } = require('../utils/emailService');

// ─────────────────────────────────────────────────────────────
// @desc    Get complaints assigned to the logged-in staff member
// @route   GET /api/staff/complaints
// @access  Private (Staff)
// ─────────────────────────────────────────────────────────────
const getAssignedComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ staff: req.user.id })
      .populate('student', 'name email roomNo phone')
      .sort({ createdAt: -1 });

    res.status(200).json({ complaints });
  } catch (error) {
    console.error('Staff get complaints error:', error.message);
    res.status(500).json({ message: 'Server error while fetching assigned complaints', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Update complaint status and/or remarks
// @route   PUT /api/staff/complaints/:id/status
// @access  Private (Staff)
// ─────────────────────────────────────────────────────────────
const updateComplaintStatus = async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const { id } = req.params;

    const allowedStatuses = ['In Progress', 'Resolved'];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Status must be "In Progress" or "Resolved"' });
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Ensure this complaint is assigned to the requesting staff
    if (complaint.staff.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to update this complaint' });
    }

    complaint.status = status;
    if (remarks !== undefined) complaint.remarks = remarks;

    if (status === 'Resolved') {
      complaint.resolvedAt = new Date();
    } else {
      complaint.resolvedAt = null;
    }

    await complaint.save();
    await complaint.populate('student', 'name email roomNo phone');

    // Send status update email to student
    sendComplaintStatusEmail(
      complaint.student.email,
      complaint.student.name,
      complaint,
      status,
      remarks || ''
    ).catch(() => {});

    res.status(200).json({
      message: `Complaint marked as "${status}"`,
      complaint,
    });
  } catch (error) {
    console.error('Staff update status error:', error.message);
    res.status(500).json({ message: 'Server error while updating complaint status', error: error.message });
  }
};

module.exports = { getAssignedComplaints, updateComplaintStatus };
