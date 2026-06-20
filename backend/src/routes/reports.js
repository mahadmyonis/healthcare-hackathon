const express = require('express');
const router = express.Router();
const pdf = require('pdf-parse');
const upload = require('../middleware/upload');
const { extractFromReport } = require('../services/openai');
const { getReferralById, updateReferral, updateReferralStatus } = require('../db/store');

// POST /api/referrals/:id/report
router.post('/:id/report', upload.single('report'), async (req, res) => {
  try {
    const referral = await getReferralById(req.params.id);
    if (!referral) return res.status(404).json({ error: 'Referral not found' });

    if (!req.file && !req.body.reportText) {
      return res.status(400).json({ error: 'Provide a file upload or reportText in the request body' });
    }

    let reportText = '';
    if (req.file) {
      if (req.file.mimetype === 'application/pdf') {
        const parsed = await pdf(req.file.buffer);
        reportText = parsed.text;
      } else {
        reportText = req.file.buffer.toString('utf-8');
      }
    } else {
      reportText = req.body.reportText;
    }

    if (!reportText.trim()) {
      return res.status(400).json({ error: 'Could not extract text from the uploaded file' });
    }

    const extraction = await extractFromReport(reportText);

    const newStatus = extraction.isRejected ? 'rejected' : 'report_submitted';
    const triggeredBy = req.body.triggeredBy || 'specialist';

    const updated = await updateReferral(req.params.id, {
      status: newStatus,
      report_text: reportText,
      report_received_at: new Date().toISOString(),
      diagnosis: extraction.diagnosis,
      key_findings: extraction.keyFindings || [],
      action_items: extraction.actionItems || [],
      follow_up_timeline: extraction.followUpTimeline,
      patient_message: extraction.patientMessage,
      urgency: extraction.urgency,
      rejection_reason: extraction.rejectionReason || null,
      suggested_next_step: extraction.suggestedNextStep || null,
    });

    // Log timeline event
    const { addTimelineEvent } = require('../db/store');
    await addTimelineEvent(
      req.params.id,
      newStatus,
      triggeredBy,
      extraction.isRejected
        ? `Report rejected: ${extraction.rejectionReason}`
        : `Report submitted. AI extracted ${extraction.actionItems?.length || 0} action items.`
    );

    res.json({ success: true, referral: updated, extraction });
  } catch (err) {
    console.error('Report processing error:', err);
    res.status(500).json({ error: 'Failed to process report', detail: err.message });
  }
});

// POST /api/referrals/process-text — demo endpoint
router.post('/process-text', async (req, res) => {
  try {
    const { reportText } = req.body;
    if (!reportText) return res.status(400).json({ error: 'reportText is required' });

    const extraction = await extractFromReport(reportText);
    res.json({ success: true, extraction });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process text', detail: err.message });
  }
});

module.exports = router;
