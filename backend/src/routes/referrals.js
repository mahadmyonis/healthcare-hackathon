const express = require('express');
const router = express.Router();
const { suggestSpecialist } = require('../services/openai');
const {
  getAllReferrals,
  getReferralById,
  createReferral,
  updateReferral,
  updateReferralStatus,
  deleteReferral,
  getTimeline,
  getAllPatients,
  getPatientById,
} = require('../db/store');

// ─────────────────────────────────────────
// PATIENTS
// ─────────────────────────────────────────

// GET /api/patients
router.get('/patients', async (req, res) => {
  try {
    const patients = await getAllPatients();
    res.json({ success: true, patients });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/patients/:id
router.get('/patients/:id', async (req, res) => {
  try {
    const patient = await getPatientById(req.params.id);
    res.json({ success: true, patient });
  } catch (err) {
    res.status(404).json({ error: 'Patient not found' });
  }
});

// ─────────────────────────────────────────
// REFERRALS
// ─────────────────────────────────────────

// GET /api/referrals
router.get('/', async (req, res) => {
  try {
    const referrals = await getAllReferrals(req.query.status || null);
    res.json({ success: true, count: referrals.length, referrals });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/referrals/:id
router.get('/:id', async (req, res) => {
  try {
    const referral = await getReferralById(req.params.id);
    res.json({ success: true, referral });
  } catch (err) {
    res.status(404).json({ error: 'Referral not found' });
  }
});

// POST /api/referrals
router.post('/', async (req, res) => {
  try {
    const { patientId, referringDoctor, specialistType, reason, urgency, appointmentNotes } = req.body;

    if (!patientId || !referringDoctor || !specialistType || !reason) {
      return res.status(400).json({
        error: 'Missing required fields: patientId, referringDoctor, specialistType, reason',
      });
    }

    const referral = await createReferral({ patientId, referringDoctor, specialistType, reason, urgency, appointmentNotes });
    res.status(201).json({ success: true, referral });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/referrals/:id/status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, triggeredBy, note } = req.body;
    const valid = ['pending', 'received', 'scheduled', 'seen', 'needs_attention', 'needs_reschedule', 'report_submitted', 'rejected', 'closed'];

    if (!valid.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${valid.join(', ')}` });
    }

    const updated = await updateReferralStatus(req.params.id, status, triggeredBy || 'system', note);
    res.json({ success: true, referral: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/referrals/:id/timeline
router.get('/:id/timeline', async (req, res) => {
  try {
    const timeline = await getTimeline(req.params.id);
    res.json({ success: true, timeline });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/referrals/:id
router.delete('/:id', async (req, res) => {
  try {
    await deleteReferral(req.params.id);
    res.json({ success: true, message: 'Referral deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/referrals/suggest-specialist
router.post('/suggest-specialist', async (req, res) => {
  try {
    const { reason, patientHistory, location } = req.body;
    if (!reason) return res.status(400).json({ error: 'reason is required' });

    const suggestion = await suggestSpecialist({ reason, patientHistory, location });
    res.json({ success: true, suggestion });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
