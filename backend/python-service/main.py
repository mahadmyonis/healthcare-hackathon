import os
import io
import json
import tempfile
from pathlib import Path
from dotenv import load_dotenv

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import torch
from pyannote.audio import Pipeline
from openai import OpenAI
from pydub import AudioSegment

load_dotenv()

app = FastAPI(title="LoopClose Audio Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────
# Init clients
# ─────────────────────────────────────────

openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Load pyannote pipeline once at startup
# Requires HuggingFace token with access to pyannote/speaker-diarization-3.1
# Accept terms at: https://huggingface.co/pyannote/speaker-diarization-3.1
print("Loading pyannote speaker diarization model...")
try:
    diarization_pipeline = Pipeline.from_pretrained(
        "pyannote/speaker-diarization-3.1",
        use_auth_token=os.getenv("HUGGINGFACE_TOKEN")
    )
    # Use GPU if available
    if torch.cuda.is_available():
        diarization_pipeline = diarization_pipeline.to(torch.device("cuda"))
        print("Using GPU for diarization")
    else:
        print("Using CPU for diarization")
    DIARIZATION_AVAILABLE = True
except Exception as e:
    print(f"pyannote model could not load: {e}")
    print("Falling back to Whisper-only mode (no speaker labels)")
    DIARIZATION_AVAILABLE = False
    diarization_pipeline = None


# ─────────────────────────────────────────
# Health check
# ─────────────────────────────────────────

@app.get("/")
def root():
    return {
        "service": "LoopClose Audio Service",
        "diarization": "available" if DIARIZATION_AVAILABLE else "unavailable (Whisper-only mode)",
        "whisper": "available",
    }


# ─────────────────────────────────────────
# Main transcription endpoint
# POST /transcribe
# ─────────────────────────────────────────

@app.post("/transcribe")
async def transcribe(
    audio: UploadFile = File(...),
    patient_history: str = Form(default="")
):
    """
    Full pipeline:
    1. pyannote diarizes the audio (who spoke when)
    2. Whisper transcribes the audio with timestamps
    3. We merge both to produce a labeled Doctor/Patient transcript
    4. GPT-4o extracts clinical notes from the labeled transcript
    """
    audio_bytes = await audio.read()

    # Save to temp file (pyannote needs a file path)
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp_path = tmp.name
        # Convert to wav for compatibility
        audio_segment = convert_to_wav(audio_bytes, audio.content_type)
        audio_segment.export(tmp_path, format="wav")

    try:
        if DIARIZATION_AVAILABLE:
            labeled_transcript = await full_pipeline(tmp_path, audio_bytes, audio.content_type)
        else:
            labeled_transcript = await whisper_only(audio_bytes, audio.content_type)

        # Extract clinical notes from labeled transcript
        clinical_notes = extract_clinical_notes(labeled_transcript, patient_history)

        return {
            "success": True,
            "transcript": labeled_transcript,
            "clinical_notes": clinical_notes,
            "diarization_used": DIARIZATION_AVAILABLE,
        }

    finally:
        Path(tmp_path).unlink(missing_ok=True)


# ─────────────────────────────────────────
# Text-only endpoint (no audio needed)
# POST /transcribe/text
# ─────────────────────────────────────────

class TextRequest(BaseModel):
    transcript: str
    patient_history: str = ""

@app.post("/transcribe/text")
def transcribe_text(body: TextRequest):
    """Extract clinical notes from an existing transcript"""
    clinical_notes = extract_clinical_notes(body.transcript, body.patient_history)
    return {
        "success": True,
        "transcript": body.transcript,
        "clinical_notes": clinical_notes,
        "diarization_used": False,
    }


# ─────────────────────────────────────────
# Core pipeline functions
# ─────────────────────────────────────────

async def full_pipeline(wav_path: str, audio_bytes: bytes, content_type: str) -> str:
    """Run pyannote diarization + Whisper transcription and merge them"""

    # Step 1: pyannote — get speaker segments
    diarization = diarization_pipeline(wav_path)

    segments = []
    for turn, _, speaker in diarization.itertracks(yield_label=True):
        segments.append({
            "start": turn.start,
            "end": turn.end,
            "speaker": speaker,  # e.g. SPEAKER_00, SPEAKER_01
        })

    # Step 2: Whisper — get transcript with word timestamps
    audio_file = io.BytesIO(audio_bytes)
    audio_file.name = f"audio.{get_extension(content_type)}"

    whisper_response = openai_client.audio.transcriptions.create(
        model="whisper-1",
        file=audio_file,
        language="en",
        response_format="verbose_json",
        timestamp_granularities=["word"],
    )

    words = whisper_response.words or []

    # Step 3: Assign each word to a speaker based on timestamp overlap
    labeled_words = assign_speakers(words, segments)

    # Step 4: Build readable transcript with Doctor/Patient labels
    # We assume 2 speakers: the one who speaks first/more = Doctor
    transcript = build_transcript(labeled_words, segments)

    return transcript


async def whisper_only(audio_bytes: bytes, content_type: str) -> str:
    """Whisper transcription without speaker diarization"""
    audio_file = io.BytesIO(audio_bytes)
    audio_file.name = f"audio.{get_extension(content_type)}"

    response = openai_client.audio.transcriptions.create(
        model="whisper-1",
        file=audio_file,
        language="en",
        response_format="text",
    )

    return str(response)


def assign_speakers(words: list, segments: list) -> list:
    """Map each word to the speaker segment it falls in"""
    result = []
    for word in words:
        word_mid = (word.start + word.end) / 2
        speaker = "SPEAKER_00"  # default
        for seg in segments:
            if seg["start"] <= word_mid <= seg["end"]:
                speaker = seg["speaker"]
                break
        result.append({"word": word.word, "speaker": speaker, "start": word.start})
    return result


def build_transcript(labeled_words: list, segments: list) -> str:
    """
    Build a clean Doctor/Patient labeled transcript.
    Assigns SPEAKER_00 = Doctor (typically speaks first),
    SPEAKER_01 = Patient. More speakers get generic labels.
    """
    # Determine which speaker is the doctor (first to speak)
    speaker_map = {}
    seen = []
    for w in labeled_words:
        if w["speaker"] not in seen:
            seen.append(w["speaker"])

    if len(seen) >= 1:
        speaker_map[seen[0]] = "Doctor"
    if len(seen) >= 2:
        speaker_map[seen[1]] = "Patient"
    for i, s in enumerate(seen[2:], start=3):
        speaker_map[s] = f"Speaker {i}"

    # Group consecutive words by same speaker into utterances
    lines = []
    current_speaker = None
    current_words = []

    for w in labeled_words:
        if w["speaker"] != current_speaker:
            if current_words and current_speaker:
                label = speaker_map.get(current_speaker, current_speaker)
                text = " ".join(current_words).strip()
                lines.append(f"{label}: {text}")
            current_speaker = w["speaker"]
            current_words = [w["word"].strip()]
        else:
            current_words.append(w["word"].strip())

    # Add final utterance
    if current_words and current_speaker:
        label = speaker_map.get(current_speaker, current_speaker)
        text = " ".join(current_words).strip()
        lines.append(f"{label}: {text}")

    return "\n\n".join(lines)


def convert_to_wav(audio_bytes: bytes, content_type: str) -> AudioSegment:
    """Convert any audio format to WAV for pyannote compatibility"""
    fmt = get_extension(content_type)
    audio_io = io.BytesIO(audio_bytes)
    return AudioSegment.from_file(audio_io, format=fmt)


def get_extension(content_type: str) -> str:
    mapping = {
        "audio/webm": "webm",
        "video/webm": "webm",
        "audio/mp4": "mp4",
        "audio/mpeg": "mp3",
        "audio/mp3": "mp3",
        "audio/wav": "wav",
        "audio/ogg": "ogg",
    }
    return mapping.get(content_type, "webm")


def extract_clinical_notes(transcript: str, patient_history: str = "") -> dict:
    """GPT-4o extracts structured clinical notes from the labeled transcript"""
    prompt = f"""You are a clinical AI assistant analyzing a doctor-patient appointment transcript from Canada.

Extract the following in structured JSON:

1. symptoms — Array of symptoms the patient mentioned
2. duration — How long symptoms have been present
3. severity — mild / moderate / severe
4. relevantHistory — Relevant medical history from transcript or patient record
5. urgencyAssessment — routine / urgent / emergent
6. urgencyReason — One sentence explaining the urgency
7. recommendedAction — What the doctor should do next
8. suggestedSpecialistType — Best specialist type (e.g. Cardiologist)
9. referralReason — Clinical referral reason, 2-3 professional sentences
10. redFlags — Any red flag symptoms needing immediate attention
11. doctorObservations — Key things the doctor noted during the visit
12. patientConcerns — Key concerns expressed by the patient

Patient history: {patient_history or 'Not provided'}

Respond ONLY with valid JSON. No markdown."""

    response = openai_client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": f"TRANSCRIPT:\n\n{transcript}"}
        ],
        temperature=0.1,
        response_format={"type": "json_object"},
    )

    return json.loads(response.choices[0].message.content)
