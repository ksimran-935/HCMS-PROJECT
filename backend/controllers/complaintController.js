const Complaint = require('../models/Complaint');

// Helper: validate description per SRS rules
const validateDescription = (description) => {
  if (!description || description.trim() === '') {
    return { valid: false, message: 'Description Required' };
  }
  if (description.trim().length > 200) {
    return { valid: false, message: 'Exceeds Limit' };
  }
  if (/^\d+$/.test(description.trim())) {
    return { valid: false, message: 'Text Only Allowed' };
  }
  return { valid: true };
};

// @desc    Submit a new complaint
// @route   POST /api/complaints
// @access  Private (Student)
const submitComplaint = async (req, res) => {
  try {
    const { category, description } = req.body;

    // Validate category
    const allowedCategories = ['Electricity', 'Water', 'Cleanliness', 'Internet', 'Room Maintenance', 'Other'];
    if (!category || !allowedCategories.includes(category)) {
      return res.status(400).json({ message: 'Category is required and must be valid' });
    }

    // Validate description
    const descValidation = validateDescription(description);
    if (!descValidation.valid) {
      return res.status(400).json({ message: descValidation.message });
    }

    const complaint = await Complaint.create({
      student: req.user.id,
      category,
      description: description.trim(),
      status: 'Pending',
    });

    await complaint.populate('student', 'name email roomNo');

    res.status(201).json({
      message: 'Complaint Registered',
      complaint,
    });
  } catch (error) {
    console.error('Submit complaint error:', error.message);
    res.status(500).json({ message: 'Server error while submitting complaint', error: error.message });
  }
};

// @desc    Get logged-in student's complaints
// @route   GET /api/complaints/my
// @access  Private (Student)
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
