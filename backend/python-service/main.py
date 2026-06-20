import os
import io
import json
import tempfile
from pathlib import Path
from dotenv import load_dotenv

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

# ─────────────────────────────────────────
# Optional imports — graceful fallback
# ─────────────────────────────────────────

try:
    import torch
    from pyannote.audio import Pipeline
    PYANNOTE_AVAILABLE = True
except Exception as e:
    print(f"pyannote unavailable: {e}")
    Pipeline = None
    PYANNOTE_AVAILABLE = False
    torch = None

from openai import OpenAI

# ─────────────────────────────────────────
# App setup
# ─────────────────────────────────────────

app = FastAPI(title="LoopMD Audio Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Load pyannote pipeline once at startup
DIARIZATION_AVAILABLE = False
diarization_pipeline = None

if PYANNOTE_AVAILABLE:
    print("Loading pyannote speaker diarization model...")
    try:
        diarization_pipeline = Pipeline.from_pretrained(
            "pyannote/speaker-diarization-3.1",
            use_auth_token=os.getenv("HUGGINGFACE_TOKEN")
        )
        if torch and torch.cuda.is_available():
            diarization_pipeline = diarization_pipeline.to(torch.device("cuda"))
            print("Using GPU for diarization")
        else:
            print("Using CPU for diarization")
        DIARIZATION_AVAILABLE = True
    except Exception as e:
        print(f"pyannote model could not load: {e}")
        print("Falling back to Whisper-only mode")
else:
    print("Running in Whisper-only mode (pyannote not available on this Python version)")


# ─────────────────────────────────────────
# Health check
# ─────────────────────────────────────────

@app.get("/")
def root():
    return {
        "service": "LoopMD Audio Service",
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
    audio_bytes = await audio.read()
    content_type = audio.content_type or "audio/webm"

    if DIARIZATION_AVAILABLE:
        labeled_transcript = await full_pipeline(audio_bytes, content_type)
    else:
        labeled_transcript = await whisper_only(audio_bytes, content_type)

    clinical_notes = extract_clinical_notes(labeled_transcript, patient_history)

    return {
        "success": True,
        "transcript": labeled_transcript,
        "clinical_notes": clinical_notes,
        "diarization_used": DIARIZATION_AVAILABLE,
    }


# ─────────────────────────────────────────
# Text-only endpoint
# POST /transcribe/text
# ─────────────────────────────────────────

class TextRequest(BaseModel):
    transcript: str
    patient_history: str = ""

@app.post("/transcribe/text")
def transcribe_text(body: TextRequest):
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

async def full_pipeline(audio_bytes: bytes, content_type: str) -> str:
    ext = get_extension(content_type)

    with tempfile.NamedTemporaryFile(suffix=f".{ext}", delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        diarization = diarization_pipeline(tmp_path)

        segments = []
        for turn, _, speaker in diarization.itertracks(yield_label=True):
            segments.append({
                "start": turn.start,
                "end": turn.end,
                "speaker": speaker,
            })

        audio_file = io.BytesIO(audio_bytes)
        audio_file.name = f"audio.{ext}"

        whisper_response = openai_client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
            language="en",
            response_format="verbose_json",
            timestamp_granularities=["word"],
        )

        words = whisper_response.words or []
        labeled_words = assign_speakers(words, segments)
        return build_transcript(labeled_words)

    finally:
        Path(tmp_path).unlink(missing_ok=True)


async def whisper_only(audio_bytes: bytes, content_type: str) -> str:
    ext = get_extension(content_type)
    audio_file = io.BytesIO(audio_bytes)
    audio_file.name = f"audio.{ext}"

    response = openai_client.audio.transcriptions.create(
        model="whisper-1",
        file=audio_file,
        language="en",
        response_format="text",
    )

    return str(response)


def assign_speakers(words: list, segments: list) -> list:
    result = []
    for word in words:
        word_mid = (word.start + word.end) / 2
        speaker = "SPEAKER_00"
        for seg in segments:
            if seg["start"] <= word_mid <= seg["end"]:
                speaker = seg["speaker"]
                break
        result.append({"word": word.word, "speaker": speaker, "start": word.start})
    return result


def build_transcript(labeled_words: list) -> str:
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

    lines = []
    current_speaker = None
    current_words = []

    for w in labeled_words:
        if w["speaker"] != current_speaker:
            if current_words and current_speaker:
                label = speaker_map.get(current_speaker, current_speaker)
                lines.append(f"{label}: {' '.join(current_words).strip()}")
            current_speaker = w["speaker"]
            current_words = [w["word"].strip()]
        else:
            current_words.append(w["word"].strip())

    if current_words and current_speaker:
        label = speaker_map.get(current_speaker, current_speaker)
        lines.append(f"{label}: {' '.join(current_words).strip()}")

    return "\n\n".join(lines)


def get_extension(content_type: str) -> str:
    mapping = {
        "audio/webm": "webm",
        "video/webm": "webm",
        "audio/mp4": "mp4",
        "audio/mpeg": "mp3",
        "audio/mp3": "mp3",
        "audio/wav": "wav",
        "audio/ogg": "ogg",
        "audio/x-wav": "wav",
    }
    return mapping.get(content_type, "webm")


def extract_clinical_notes(transcript: str, patient_history: str = "") -> dict:
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
