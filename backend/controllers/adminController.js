const Complaint = require('../models/Complaint');
const User = require('../models/User');
const {
  sendComplaintAssignedEmail,
  sendStaffAssignmentEmail,
} = require('../utils/emailService');

// ─────────────────────────────────────────────────────────────
// @desc    Get all complaints (with optional filters)
// @route   GET /api/admin/complaints
// @access  Private (Admin)
// ─────────────────────────────────────────────────────────────
const getAllComplaints = async (req, res) => {
  try {
    const { status, category, hostel } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (hostel) filter.hostel = new RegExp(hostel, 'i');

    const complaints = await Complaint.find(filter)
      .populate('student', 'name email roomNo phone')
      .populate('staff', 'name email department')
      .sort({ createdAt: -1 });

    res.status(200).json({ complaints });
  } catch (error) {
    console.error('Admin get complaints error:', error.message);
    res.status(500).json({ message: 'Server error while fetching complaints', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Get analytics summary
// @route   GET /api/admin/analytics
// @access  Private (Admin)
// ─────────────────────────────────────────────────────────────
const getAnalytics = async (req, res) => {
  try {
    const [
      total,
      pending,
      assigned,
      inProgress,
      resolved,
      byCategory,
      byHostel,
      byMonth,
    ] = await Promise.all([
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: 'Pending' }),
      Complaint.countDocuments({ status: 'Assigned' }),
      Complaint.countDocuments({ status: 'In Progress' }),
      Complaint.countDocuments({ status: 'Resolved' }),
      // Complaints grouped by category
      Complaint.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      // Complaints grouped by hostel
      Complaint.aggregate([
        { $group: { _id: '$hostel', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      // Complaints by month (last 6 months)
      Complaint.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(new Date().setMonth(new Date().getMonth() - 5)),
            },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
    ]);

    res.status(200).json({
      summary: { total, pending, assigned, inProgress, resolved },
      byCategory: byCategory.map((d) => ({ name: d._id, value: d.count })),
      byHostel: byHostel.map((d) => ({ name: d._id || 'Unknown', value: d.count })),
      byMonth: byMonth.map((d) => ({
        name: `${d._id.year}-${String(d._id.month).padStart(2, '0')}`,
        count: d.count,
      })),
    });
  } catch (error) {
    console.error('Analytics error:', error.message);
    res.status(500).json({ message: 'Server error while fetching analytics', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Get all students
// @route   GET /api/admin/students
// @access  Private (Admin)
// ─────────────────────────────────────────────────────────────
const getAllStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password').sort({ createdAt: -1 });
    res.status(200).json({ students });
  } catch (error) {
    console.error('Admin get students error:', error.message);
    res.status(500).json({ message: 'Server error while fetching students', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Get all maintenance staff
// @route   GET /api/admin/staff
// @access  Private (Admin)
// ─────────────────────────────────────────────────────────────
const getAllStaff = async (req, res) => {
  try {
    const staff = await User.find({ role: 'staff' }).select('-password').sort({ name: 1 });
    res.status(200).json({ staff });
  } catch (error) {
    console.error('Admin get staff error:', error.message);
    res.status(500).json({ message: 'Server error while fetching staff', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Assign a complaint to a staff member (manual)
// @route   PUT /api/admin/complaints/:id/assign
// @access  Private (Admin)
// ─────────────────────────────────────────────────────────────
const assignComplaint = async (req, res) => {
  try {
    const { staffId } = req.body;
    const { id } = req.params;

    if (!staffId) {
      return res.status(400).json({ message: 'Staff ID is required for assignment' });
    }

    const staff = await User.findOne({ _id: staffId, role: 'staff' });
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    complaint.staff = staffId;
    complaint.status = 'Assigned';
    await complaint.save();

    await complaint.populate('student', 'name email roomNo phone');
    await complaint.populate('staff', 'name email department');

    const student = complaint.student;

    // Email to student
    sendComplaintAssignedEmail(
      student.email,
      student.name,
      complaint,
      staff.name,
      staff.department
    ).catch(() => { });

    // Email to staff
    sendStaffAssignmentEmail(
      staff.email,
      staff.name,
      complaint,
      student.name
    ).catch(() => { });

    res.status(200).json({
      message: `Complaint successfully assigned to ${staff.name}`,
      complaint,
    });
  } catch (error) {
    console.error('Admin assign complaint error:', error.message);
    res.status(500).json({ message: 'Server error while assigning complaint', error: error.message });
  }
};

module.exports = {
  getAllComplaints,
  getAnalytics,
  getAllStudents,
  getAllStaff,
  assignComplaint,
};
