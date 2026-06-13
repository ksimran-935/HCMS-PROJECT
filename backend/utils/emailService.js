const nodemailer = require('nodemailer');

// --------------- Nodemailer Setup ---------------
const getMailTransport = () => {
  const host = process.env.MAIL_HOST;
  const user = process.env.MAIL_USER;
  const pass = process.env.MAIL_PASS;

  if (
    !host || !user || !pass ||
    user === 'your_gmail@gmail.com' ||
    pass === 'your_16_char_app_password'
  ) {
    return null; // not configured
  }

  return nodemailer.createTransport({
    host,
    port: parseInt(process.env.MAIL_PORT, 10) || 587,
    secure: process.env.MAIL_SECURE === 'true',
    auth: { user, pass },
  });
};

const FROM = () => process.env.MAIL_FROM || 'HCMS <no-reply@hcms.com>';

const sendMail = async ({ to, subject, text, html }) => {
  const transport = getMailTransport();
  if (!transport) {
    console.error('❌ SMTP not configured — check MAIL_HOST, MAIL_USER, MAIL_PASS in .env');
    return false;
  }
  try {
    await transport.sendMail({ from: FROM(), to, subject, text, html });
    console.log(`✅ Email sent to ${to}: ${subject}`);
    return true;
  } catch (err) {
    console.error('❌ SMTP sendMail failed:', err.message);
    return false;
  }
};

// ────────────────────────────────────────────────
// Auth Emails
// ────────────────────────────────────────────────

const sendRegisterOTPEmail = async (to, otp, name) =>
  sendMail({
    to,
    subject: 'HCMS — Verify Your Email (Registration OTP)',
    text: `Hello ${name},\n\nYour HCMS registration OTP is: ${otp}\n\nThis code expires in 10 minutes.`,
    html: `
      <div style="font-family:Arial,sans-serif;color:#1f2937;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px;">
        <h2 style="color:#5b21b6;margin-bottom:8px;">Verify Your Email</h2>
        <p style="color:#6b7280;margin-bottom:4px;">Hello <strong>${name}</strong>,</p>
        <p style="color:#6b7280;margin-bottom:24px;">Use the OTP below to complete your HCMS registration.</p>
        <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;padding:20px;text-align:center;margin-bottom:24px;">
          <p style="font-size:2rem;font-weight:700;letter-spacing:0.5rem;color:#5b21b6;margin:0;">${otp}</p>
        </div>
        <p style="font-size:0.85rem;color:#9ca3af;">This code expires in <strong>10 minutes</strong>. If you did not request this, please ignore this email.</p>
      </div>
    `,
  });

const sendResetOTPEmail = async (to, otp) =>
  sendMail({
    to,
    subject: 'HCMS Password Reset OTP',
    text: `Your HCMS password reset code is: ${otp}\n\nThis code will expire in 10 minutes.`,
    html: `
      <div style="font-family:Arial,sans-serif;color:#1f2937;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px;">
        <h2 style="color:#5b21b6;margin-bottom:8px;">HCMS Password Reset</h2>
        <p style="color:#6b7280;margin-bottom:24px;">You requested a password reset. Use the OTP below to proceed.</p>
        <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;padding:20px;text-align:center;margin-bottom:24px;">
          <p style="font-size:2rem;font-weight:700;letter-spacing:0.5rem;color:#5b21b6;margin:0;">${otp}</p>
        </div>
        <p style="font-size:0.85rem;color:#9ca3af;">This code expires in <strong>10 minutes</strong>. If you did not request this, please ignore this email.</p>
      </div>
    `,
  });

const sendLoginOTPEmail = async (to, otp, name) =>
  sendMail({
    to,
    subject: 'HCMS Login OTP',
    text: `Hello ${name},\n\nYour HCMS login OTP is: ${otp}\n\nThis code expires in 10 minutes.`,
    html: `
      <div style="font-family:Arial,sans-serif;color:#1f2937;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px;">
        <h2 style="color:#5b21b6;margin-bottom:8px;">HCMS Login Verification</h2>
        <p style="color:#6b7280;margin-bottom:4px;">Hello <strong>${name}</strong>,</p>
        <p style="color:#6b7280;margin-bottom:24px;">Use the OTP below to complete your login.</p>
        <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;padding:20px;text-align:center;margin-bottom:24px;">
          <p style="font-size:2rem;font-weight:700;letter-spacing:0.5rem;color:#5b21b6;margin:0;">${otp}</p>
        </div>
        <p style="font-size:0.85rem;color:#9ca3af;">This code expires in <strong>10 minutes</strong>. If you did not attempt to log in, please ignore this email.</p>
      </div>
    `,
  });

// ────────────────────────────────────────────────
// Complaint Emails
// ────────────────────────────────────────────────

const complaintCard = (complaint) => `
  <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:0.9rem;">
    <tr><td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600;width:40%;">Category</td><td style="padding:8px 12px;border:1px solid #e5e7eb;">${complaint.category}</td></tr>
    <tr><td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600;">Hostel</td><td style="padding:8px 12px;border:1px solid #e5e7eb;">${complaint.hostel || '—'}</td></tr>
    <tr><td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600;">Room No.</td><td style="padding:8px 12px;border:1px solid #e5e7eb;">${complaint.roomNo || '—'}</td></tr>
    <tr><td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600;">Description</td><td style="padding:8px 12px;border:1px solid #e5e7eb;">${complaint.description}</td></tr>
  </table>
`;

/** Sent to student when they submit a complaint */
const sendComplaintSubmittedEmail = async (to, studentName, complaint) =>
  sendMail({
    to,
    subject: `HCMS — Complaint Received (#${complaint._id.toString().slice(-6).toUpperCase()})`,
    text: `Hello ${studentName},\n\nYour complaint has been received.\nCategory: ${complaint.category}\nDescription: ${complaint.description}\n\nWe will assign it to the relevant department shortly.`,
    html: `
      <div style="font-family:Arial,sans-serif;color:#1f2937;max-width:520px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px;">
        <h2 style="color:#5b21b6;">✅ Complaint Received</h2>
        <p>Hello <strong>${studentName}</strong>,</p>
        <p>Your complaint has been successfully submitted. Here are the details:</p>
        ${complaintCard(complaint)}
        <p style="color:#6b7280;font-size:0.85rem;">We will assign it to the relevant maintenance department shortly. You will receive an email once it is assigned.</p>
      </div>
    `,
  });

/** Sent to student when their complaint is assigned to a staff member */
const sendComplaintAssignedEmail = async (to, studentName, complaint, staffName, staffDept) =>
  sendMail({
    to,
    subject: `HCMS — Complaint Assigned to ${staffName}`,
    text: `Hello ${studentName},\n\nYour complaint (Category: ${complaint.category}) has been assigned to ${staffName} (${staffDept}).\n\nThey will contact you soon.`,
    html: `
      <div style="font-family:Arial,sans-serif;color:#1f2937;max-width:520px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px;">
        <h2 style="color:#5b21b6;">🔧 Complaint Assigned</h2>
        <p>Hello <strong>${studentName}</strong>,</p>
        <p>Your complaint has been assigned to a maintenance staff member:</p>
        ${complaintCard(complaint)}
        <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;padding:16px;margin-bottom:16px;">
          <strong>Assigned To:</strong> ${staffName} &nbsp;|&nbsp; <strong>Department:</strong> ${staffDept}
        </div>
        <p style="color:#6b7280;font-size:0.85rem;">They will work on your issue shortly.</p>
      </div>
    `,
  });

/** Sent to staff member when a complaint is assigned to them */
const sendStaffAssignmentEmail = async (to, staffName, complaint, studentName) =>
  sendMail({
    to,
    subject: `HCMS — New Complaint Assigned to You`,
    text: `Hello ${staffName},\n\nA new complaint has been assigned to you.\nStudent: ${studentName}\nCategory: ${complaint.category}\nDescription: ${complaint.description}`,
    html: `
      <div style="font-family:Arial,sans-serif;color:#1f2937;max-width:520px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px;">
        <h2 style="color:#5b21b6;">📋 New Complaint Assigned</h2>
        <p>Hello <strong>${staffName}</strong>,</p>
        <p>A complaint has been assigned to you. Please address it at the earliest:</p>
        ${complaintCard(complaint)}
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin-bottom:16px;">
          <strong>Reported By:</strong> ${studentName}
        </div>
        <p style="color:#6b7280;font-size:0.85rem;">Please log in to the HCMS portal to update the status once you begin working on it.</p>
      </div>
    `,
  });

/** Sent to student on any status change (In Progress / Resolved) */
const sendComplaintStatusEmail = async (to, studentName, complaint, newStatus, remarks) =>
  sendMail({
    to,
    subject: `HCMS — Complaint Status Updated: ${newStatus}`,
    text: `Hello ${studentName},\n\nYour complaint status has been updated to: ${newStatus}.\n${remarks ? `Staff Remark: ${remarks}` : ''}`,
    html: `
      <div style="font-family:Arial,sans-serif;color:#1f2937;max-width:520px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px;">
        <h2 style="color:${newStatus === 'Resolved' ? '#059669' : '#d97706'};">${newStatus === 'Resolved' ? '🎉' : '⚙️'} Complaint ${newStatus}</h2>
        <p>Hello <strong>${studentName}</strong>,</p>
        <p>The status of your complaint has been updated to <strong>${newStatus}</strong>.</p>
        ${complaintCard(complaint)}
        ${remarks ? `<div style="background:#fef9c3;border:1px solid #fde68a;border-radius:8px;padding:16px;margin-bottom:16px;"><strong>💬 Staff Remark:</strong> ${remarks}</div>` : ''}
        ${newStatus === 'Resolved' ? '<p style="color:#059669;font-weight:600;">Your complaint has been resolved. Thank you for using HCMS!</p>' : '<p style="color:#6b7280;font-size:0.85rem;">Our staff is actively working on your issue.</p>'}
      </div>
    `,
  });

module.exports = {
  sendRegisterOTPEmail,
  sendResetOTPEmail,
  sendLoginOTPEmail,
  sendComplaintSubmittedEmail,
  sendComplaintAssignedEmail,
  sendStaffAssignmentEmail,
  sendComplaintStatusEmail,
};
