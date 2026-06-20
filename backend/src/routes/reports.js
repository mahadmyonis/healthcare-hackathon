const express = require('express');
const router = express.Router();
const pdf = require('pdf-parse');
const upload = require('../middleware/upload');
const { extractFromReport } = require('../services/openai');
const { getReferralById, updateReferral, REFERRAL_STATUS } = require('../db/store');

// POST /api/referrals/:id/report
// Upload a specialist consultation note (PDF or TXT) and extract action items
router.post('/:id/report', upload.single('report'), async (req, res) => {
  try {
    const referral = getReferralById(req.params.id);
    if (!referral) {
      return res.status(404).json({ error: 'Referral not found' });
    }

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

    // Run AI extraction
    const extraction = await extractFromReport(reportText);

    // Determine new status
    const newStatus = extraction.isRejected
      ? REFERRAL_STATUS.REJECTED
      : REFERRAL_STATUS.CLOSED;

    const updated = updateReferral(req.params.id, {
      status: newStatus,
      report: {
        rawText: reportText,
        receivedAt: new Date().toISOString(),
      },
      actionItems: extraction.actionItems || [],
      diagnosis: extraction.diagnosis,
      keyFindings: extraction.keyFindings || [],
      followUpTimeline: extraction.followUpTimeline,
      patientMessage: extraction.patientMessage,
      urgency: extraction.urgency,
      rejectionReason: extraction.rejectionReason || null,
      suggestedNextStep: extraction.suggestedNextStep || null,
    });

    res.json({
      success: true,
      referral: updated,
      extraction,
    });
  } catch (err) {
    console.error('Report processing error:', err);
    res.status(500).json({ error: 'Failed to process report', detail: err.message });
  }
});

// POST /api/referrals/process-text
// Quick endpoint to extract from raw text without a referral record (for demos)
router.post('/process-text', async (req, res) => {
  try {
    const { reportText } = req.body;
    if (!reportText) {
      return res.status(400).json({ error: 'reportText is required' });
    }

    const extraction = await extractFromReport(reportText);
    res.json({ success: true, extraction });
  } catch (err) {
    console.error('Text processing error:', err);
    res.status(500).json({ error: 'Failed to process text', detail: err.message });
  }
});

module.exports = router;
