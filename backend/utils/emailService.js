const nodemailer = require('nodemailer');

// --------------- Nodemailer Setup ---------------
let _transporter = null;

const getMailTransport = () => {
  const host = process.env.MAIL_HOST;
  const user = process.env.MAIL_USER;
  const pass = process.env.MAIL_PASS;

  if (!host || !user || !pass) return null;

  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host,
      port: parseInt(process.env.MAIL_PORT, 10) || 587,
      secure: process.env.MAIL_SECURE === 'true',
      auth: { user, pass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }

  return _transporter;
};

const FROM = () => process.env.MAIL_FROM || 'HCMS <no-reply@hcms.com>';

const sendMail = async ({ to, subject, text, html }) => {
  const transport = getMailTransport();
  if (!transport) {
    console.warn('⚠ SMTP not configured — email skipped');
    return false;
  }
  try {
    await transport.sendMail({ from: FROM(), to, subject, text, html });
    console.log(`✅ Email sent to ${to}: ${subject}`);
    return true;
  } catch (err) {
    console.error('❌ SMTP sendMail failed:', err.message);
    _transporter = null;
    return false;
  }
};

// ────────────────────────────────────────────────
// Password Reset Email
// ────────────────────────────────────────────────

/**
 * Sends a password reset link to the user.
 * @param {string} to - recipient email
 * @param {string} name - recipient name
 * @param {string} resetUrl - full reset URL containing the raw token
 */
const sendPasswordResetEmail = async (to, name, resetUrl) =>
  sendMail({
    to,
    subject: 'HCMS — Password Reset Request',
    text: `Hello ${name},\n\nYou requested a password reset for your HCMS account.\n\nClick the link below to reset your password (valid for 30 minutes):\n${resetUrl}\n\nIf you did not request this, please ignore this email.`,
    html: `
      <div style="font-family:Arial,sans-serif;color:#1f2937;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px;">
        <h2 style="color:#1d4ed8;margin-bottom:8px;">🔑 Password Reset</h2>
        <p style="color:#374151;">Hello <strong>${name}</strong>,</p>
        <p style="color:#6b7280;margin-bottom:24px;">
          You requested a password reset for your HCMS account. Click the button below to set a new password.
          This link is valid for <strong>30 minutes</strong>.
        </p>
        <div style="text-align:center;margin-bottom:24px;">
          <a href="${resetUrl}"
             style="display:inline-block;background:#1d4ed8;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:1rem;">
            Reset My Password
          </a>
        </div>
        <p style="font-size:0.82rem;color:#9ca3af;word-break:break-all;">
          If the button doesn't work, copy and paste this URL into your browser:<br/>${resetUrl}
        </p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;"/>
        <p style="font-size:0.78rem;color:#9ca3af;">
          If you did not request a password reset, please ignore this email. Your password will not change.
        </p>
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
        <p style="color:#6b7280;font-size:0.85rem;">We will assign it to the relevant maintenance department shortly.</p>
      </div>
    `,
  });

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
  sendPasswordResetEmail,
  sendComplaintSubmittedEmail,
  sendComplaintAssignedEmail,
  sendStaffAssignmentEmail,
  sendComplaintStatusEmail,
};
