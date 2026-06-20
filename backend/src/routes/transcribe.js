const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');

const PYTHON_SERVICE = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB Whisper limit
  fileFilter: (req, file, cb) => {
    const allowed = ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'video/webm'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported audio format. Use webm, mp4, mp3, or wav.'), false);
    }
  },
});

// POST /api/transcribe
// Accepts audio → forwards to Python service (pyannote + Whisper + GPT-4o)
// Returns: labeled transcript + clinical notes
router.post('/', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Audio file required. Send as multipart field named "audio".' });
    }

    const form = new FormData();
    form.append('audio', req.file.buffer, {
      filename: `recording.${getExtension(req.file.mimetype)}`,
      contentType: req.file.mimetype,
    });

    if (req.body.patientHistory) {
      form.append('patient_history', req.body.patientHistory);
    }

    const response = await axios.post(`${PYTHON_SERVICE}/transcribe`, form, {
      headers: form.getHeaders(),
      timeout: 120000, // 2 min timeout for longer recordings
    });

    res.json(response.data);
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      return res.status(503).json({
        error: 'Audio service unavailable. Make sure the Python service is running on port 8000.',
        detail: 'Run: cd backend/python-service && uvicorn main:app --reload --port 8000'
      });
    }
    console.error('Transcription error:', err.message);
    res.status(500).json({ error: 'Transcription failed', detail: err.message });
  }
});

// POST /api/transcribe/text
// Send existing transcript text → get clinical notes back
router.post('/text', async (req, res) => {
  try {
    const { transcript, patientHistory } = req.body;
    if (!transcript) return res.status(400).json({ error: 'transcript is required' });

    const response = await axios.post(`${PYTHON_SERVICE}/transcribe/text`, {
      transcript,
      patient_history: patientHistory || '',
    }, { timeout: 30000 });

    res.json(response.data);
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      return res.status(503).json({
        error: 'Audio service unavailable.',
        detail: 'Run: cd backend/python-service && uvicorn main:app --reload --port 8000'
      });
    }
    res.status(500).json({ error: 'Clinical note extraction failed', detail: err.message });
  }
});

// GET /api/transcribe/status
// Check if the Python service is alive
router.get('/status', async (req, res) => {
  try {
    const response = await axios.get(`${PYTHON_SERVICE}/`, { timeout: 5000 });
    res.json({ success: true, service: response.data });
  } catch {
    res.json({ success: false, message: 'Python audio service is not running' });
  }
});

function getExtension(mimetype) {
  const map = {
    'audio/webm': 'webm',
    'video/webm': 'webm',
    'audio/mp4': 'mp4',
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/wav': 'wav',
    'audio/ogg': 'ogg',
  };
  return map[mimetype] || 'webm';
}

module.exports = router;
