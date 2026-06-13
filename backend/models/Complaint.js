const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required'],
    },
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    category: {
      type: String,
      enum: ['Electricity', 'Water', 'Cleanliness', 'Internet', 'Room Maintenance', 'Other'],
      required: [true, 'Category is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    // Complaint-specific location info
    hostel: {
      type: String,
      trim: true,
      required: [true, 'Hostel name is required'],
    },
    roomNo: {
      type: String,
      trim: true,
      default: '',
    },
    mobileNo: {
      type: String,
      trim: true,
      required: [true, 'Mobile number is required'],
    },
    status: {
      type: String,
      enum: ['Pending', 'Assigned', 'In Progress', 'Resolved'],
      default: 'Pending',
    },
    remarks: {
      type: String,
      default: '',
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Complaint', complaintSchema);
