const Complaint = require('../models/Complaint');
const User = require('../models/User');
const {
  sendComplaintSubmittedEmail,
  sendComplaintAssignedEmail,
  sendStaffAssignmentEmail,
} = require('../utils/emailService');

// Helper: validate description
const validateDescription = (description) => {
  if (!description || description.trim() === '') {
    return { valid: false, message: 'Description Required' };
  }
  if (description.trim().length > 500) {
    return { valid: false, message: 'Description exceeds 500 character limit' };
  }
  if (/^\d+$/.test(description.trim())) {
    return { valid: false, message: 'Text Only Allowed' };
  }
  return { valid: true };
};

// ─────────────────────────────────────────────────────────────
// @desc    Submit a new complaint (with auto-assignment)
// @route   POST /api/complaints
// @access  Private (Student)
// ─────────────────────────────────────────────────────────────
const submitComplaint = async (req, res) => {
  try {
    const { category, description, hostel, roomNo, mobileNo } = req.body;

    // Validate category
    const allowedCategories = [
      'Electricity', 'Water', 'Cleanliness', 'Internet', 'Room Maintenance', 'Other',
    ];
    if (!category || !allowedCategories.includes(category)) {
      return res.status(400).json({ message: 'Category is required and must be valid' });
    }

    // Validate description
    const descValidation = validateDescription(description);
    if (!descValidation.valid) {
      return res.status(400).json({ message: descValidation.message });
    }

    // Validate required fields
    if (!hostel || !hostel.trim()) {
      return res.status(400).json({ message: 'Hostel name is required' });
    }
    if (!mobileNo || !/^\d{10}$/.test(mobileNo.trim())) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit mobile number' });
    }

    // ── Auto-assignment: find a staff member in matching department ──
    // "Other" category maps to "Other" department; rest match directly
    const deptMap = {
      'Electricity': 'Electricity',
      'Water': 'Water',
      'Cleanliness': 'Cleanliness',
      'Internet': 'Internet',
      'Room Maintenance': 'Room Maintenance',
      'Other': 'Other',
    };
    const targetDept = deptMap[category];

    // Find staff in matching department (round-robin via random selection)
    const matchingStaff = await User.find({ role: 'staff', department: targetDept });

    let assignedStaff = null;
    if (matchingStaff.length > 0) {
      const randomIndex = Math.floor(Math.random() * matchingStaff.length);
      assignedStaff = matchingStaff[randomIndex];
    }

    // Create the complaint
    const complaintData = {
      student: req.user.id,
      category,
      description: description.trim(),
      hostel: hostel.trim(),
      roomNo: (roomNo || '').trim(),
      mobileNo: mobileNo.trim(),
      status: assignedStaff ? 'Assigned' : 'Pending',
    };
    if (assignedStaff) complaintData.staff = assignedStaff._id;

    const complaint = await Complaint.create(complaintData);
    await complaint.populate('student', 'name email roomNo phone');
    if (assignedStaff) await complaint.populate('staff', 'name email department');

    // ── Send emails ──
    const student = complaint.student;

    // Email to student: complaint received
    sendComplaintSubmittedEmail(student.email, student.name, complaint).catch(() => {});

    if (assignedStaff) {
      // Email to student: complaint assigned
      sendComplaintAssignedEmail(
        student.email,
        student.name,
        complaint,
        assignedStaff.name,
        assignedStaff.department
      ).catch(() => {});

      // Email to staff: new assignment
      sendStaffAssignmentEmail(
        assignedStaff.email,
        assignedStaff.name,
        complaint,
        student.name
      ).catch(() => {});
    }

    res.status(201).json({
      message: assignedStaff
        ? `Complaint registered and auto-assigned to ${assignedStaff.name} (${assignedStaff.department})`
        : 'Complaint Registered. Admin will assign it to relevant staff shortly.',
      complaint,
    });
  } catch (error) {
    console.error('Submit complaint error:', error.message);
    res.status(500).json({ message: 'Server error while submitting complaint', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Get logged-in student's complaints
// @route   GET /api/complaints/my
// @access  Private (Student)
// ─────────────────────────────────────────────────────────────
const getMyComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ student: req.user.id })
      .populate('staff', 'name email department')
      .sort({ createdAt: -1 });

    res.status(200).json({ complaints });
  } catch (error) {
    console.error('Get my complaints error:', error.message);
    res.status(500).json({ message: 'Server error while fetching complaints', error: error.message });
  }
};

module.exports = { submitComplaint, getMyComplaints };
