const Complaint = require('../models/Complaint');
const User = require('../models/User');

// @desc    Get all complaints (with optional filters)
// @route   GET /api/admin/complaints
// @access  Private (Admin)
const getAllComplaints = async (req, res) => {
  try {
    const { status, category } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (category) filter.category = category;

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

// @desc    Get all students
// @route   GET /api/admin/students
// @access  Private (Admin)
const getAllStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password').sort({ createdAt: -1 });
    res.status(200).json({ students });
  } catch (error) {
    console.error('Admin get students error:', error.message);
    res.status(500).json({ message: 'Server error while fetching students', error: error.message });
  }
};

// @desc    Get all maintenance staff
// @route   GET /api/admin/staff
// @access  Private (Admin)
const getAllStaff = async (req, res) => {
  try {
    const staff = await User.find({ role: 'staff' }).select('-password').sort({ name: 1 });
    res.status(200).json({ staff });
  } catch (error) {
    console.error('Admin get staff error:', error.message);
    res.status(500).json({ message: 'Server error while fetching staff', error: error.message });
  }
};

// @desc    Assign a complaint to a staff member
// @route   PUT /api/admin/complaints/:id/assign
// @access  Private (Admin)
const assignComplaint = async (req, res) => {
  try {
    const { staffId } = req.body;
    const { id } = req.params;

    if (!staffId) {
      return res.status(400).json({ message: 'Staff ID is required for assignment' });
    }

    // Verify staff exists and has role staff
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

    res.status(200).json({
      message: `Complaint successfully assigned to ${staff.name}`,
      complaint,
    });
  } catch (error) {
    console.error('Admin assign complaint error:', error.message);
    res.status(500).json({ message: 'Server error while assigning complaint', error: error.message });
  }
};

module.exports = { getAllComplaints, getAllStudents, getAllStaff, assignComplaint };
