const express = require('express');
const router = express.Router();
const multer = require('multer');
const OpenAI = require('openai');
const { extractClinicalNotes } = require('../services/openai');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Audio files only
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB — Whisper limit
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
// Accepts audio file, returns transcript + AI clinical notes
router.post('/', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Audio file required. Send as multipart field named "audio".' });
    }

    // Convert buffer to a File-like object Whisper accepts
    const audioFile = new File([req.file.buffer], `recording.${getExtension(req.file.mimetype)}`, {
      type: req.file.mimetype,
    });

    // Transcribe with Whisper
    const transcription = await client.audio.transcriptions.create({
      model: 'whisper-1',
      file: audioFile,
      language: 'en',
      response_format: 'verbose_json', // includes word-level timestamps
    });

    const transcript = transcription.text;

    // Extract clinical notes from transcript using GPT-4o
    const clinicalNotes = await extractClinicalNotes(transcript, req.body.patientHistory || null);

    res.json({
      success: true,
      transcript,
      duration: transcription.duration,
      clinicalNotes,
    });
  } catch (err) {
    console.error('Transcription error:', err);
    res.status(500).json({ error: 'Transcription failed', detail: err.message });
  }
});

// POST /api/transcribe/text
// If you already have the transcript text, just extract clinical notes from it
router.post('/text', async (req, res) => {
  try {
    const { transcript, patientHistory } = req.body;
    if (!transcript) return res.status(400).json({ error: 'transcript is required' });

    const clinicalNotes = await extractClinicalNotes(transcript, patientHistory || null);

    res.json({ success: true, transcript, clinicalNotes });
  } catch (err) {
    res.status(500).json({ error: 'Clinical note extraction failed', detail: err.message });
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
