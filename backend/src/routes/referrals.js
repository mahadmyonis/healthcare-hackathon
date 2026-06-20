const express = require('express');
const router = express.Router();
const { suggestSpecialist } = require('../services/openai');
const {
  createReferral,
  getAllReferrals,
  getReferralById,
  updateReferral,
  deleteReferral,
  REFERRAL_STATUS,
} = require('../db/store');

// GET /api/referrals
// Get all referrals with optional status filter
router.get('/', (req, res) => {
  let all = getAllReferrals();
  if (req.query.status) {
    all = all.filter((r) => r.status === req.query.status);
  }
  res.json({ success: true, count: all.length, referrals: all });
});

// GET /api/referrals/:id
router.get('/:id', (req, res) => {
  const referral = getReferralById(req.params.id);
  if (!referral) return res.status(404).json({ error: 'Referral not found' });
  res.json({ success: true, referral });
});

// POST /api/referrals
// Create a new referral
router.post('/', (req, res) => {
  const { patientName, patientDOB, referringDoctor, specialistType, reason, urgency } = req.body;

  if (!patientName || !referringDoctor || !specialistType || !reason) {
    return res.status(400).json({
      error: 'Missing required fields: patientName, referringDoctor, specialistType, reason',
    });
  }

  const referral = createReferral({ patientName, patientDOB, referringDoctor, specialistType, reason, urgency });
  res.status(201).json({ success: true, referral });
});

// PATCH /api/referrals/:id/status
// Update referral status manually (e.g. mark as received, booked)
router.patch('/:id/status', (req, res) => {
  const { status } = req.body;
  const validStatuses = Object.values(REFERRAL_STATUS);

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  const updated = updateReferral(req.params.id, { status });
  if (!updated) return res.status(404).json({ error: 'Referral not found' });

  res.json({ success: true, referral: updated });
});

// DELETE /api/referrals/:id
router.delete('/:id', (req, res) => {
  const deleted = deleteReferral(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Referral not found' });
  res.json({ success: true, message: 'Referral deleted' });
});

// POST /api/referrals/suggest-specialist
// AI suggests the right specialist based on patient reason
router.post('/suggest-specialist', async (req, res) => {
  try {
    const { reason, patientHistory, location } = req.body;
    if (!reason) return res.status(400).json({ error: 'reason is required' });

    const suggestion = await suggestSpecialist({ reason, patientHistory, location });
    res.json({ success: true, suggestion });
  } catch (err) {
    console.error('Specialist suggestion error:', err);
    res.status(500).json({ error: 'Failed to suggest specialist', detail: err.message });
  }
});

module.exports = router;
