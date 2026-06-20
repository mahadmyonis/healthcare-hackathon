const { v4: uuidv4 } = require('uuid');

// In-memory store — swap for a real DB (Postgres/Supabase) when ready
const referrals = new Map();

const REFERRAL_STATUS = {
  SENT: 'sent',
  RECEIVED: 'received',
  BOOKED: 'booked',
  REPORT_RETURNED: 'report_returned',
  CLOSED: 'closed',
  REJECTED: 'rejected',
};

function createReferral({ patientName, patientDOB, referringDoctor, specialistType, reason, urgency = 'routine' }) {
  const id = uuidv4();
  const referral = {
    id,
    patientName,
    patientDOB,
    referringDoctor,
    specialistType,
    reason,
    urgency,
    status: REFERRAL_STATUS.SENT,
    sentAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    report: null,
    actionItems: [],
    rejectionReason: null,
    suggestedNextStep: null,
  };
  referrals.set(id, referral);
  return referral;
}

function getAllReferrals() {
  return Array.from(referrals.values()).sort(
    (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
  );
}

function getReferralById(id) {
  return referrals.get(id) || null;
}

function updateReferral(id, updates) {
  const referral = referrals.get(id);
  if (!referral) return null;
  const updated = { ...referral, ...updates, updatedAt: new Date().toISOString() };
  referrals.set(id, updated);
  return updated;
}

function deleteReferral(id) {
  return referrals.delete(id);
}

module.exports = {
  createReferral,
  getAllReferrals,
  getReferralById,
  updateReferral,
  deleteReferral,
  REFERRAL_STATUS,
};
