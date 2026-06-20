# LoopMD — AI-Powered Medical Referral Management

> Built at the AI in Healthcare Hackathon — Invest Ottawa, June 2026

LoopMD fixes the broken referral loop in primary care. Referrals get sent and forgotten, specialist reports sit unread, and no one tracks whether the patient's care ever moved forward. Our AI listens to appointments in real time, auto-generates the referral, and tracks every status from sent to closed. When the specialist report comes back, AI extracts every action item and surfaces it directly to the doctor. One platform. Zero dropped handoffs.

---

## Demo

| | |
|---|---|
| **Live Demo** | [healthcare-hackathon-rosy.vercel.app](https://healthcare-hackathon-rosy.vercel.app/) |
| **Demo Video** | [youtu.be/wSJk4Z1oV_A](https://youtu.be/wSJk4Z1oV_A) |

---

## The Problem

In Canada, the referral process is broken at every handoff:

- Referrals are faxed and forgotten
- Specialists send back reports that sit unread in inboxes
- Action items never get extracted
- Patients wait weeks with no visibility into their own care
- No system tracks whether the loop ever closes

---

## The Solution

LoopMD covers the full referral journey in four steps:

1. **Listen** — Doctor hits Record during the appointment. OpenAI Whisper transcribes the conversation live with real-time display
2. **Generate** — GPT-4o extracts symptoms, urgency, red flags, and suggested specialist. Referral is auto-generated in one click
3. **Track** — Every referral enters a ticketing system with a full status timeline: `pending → received → scheduled → seen → report submitted → closed`
4. **Extract** — When the specialist report arrives, AI reads it and surfaces every action item, follow-up date, and patient message directly to the doctor

---

## Features

- Real-time appointment transcription using OpenAI Whisper + Web Speech API
- AI clinical note extraction (symptoms, urgency, red flags, specialist recommendation)
- Referral ticketing system with 9 status states
- Full per-referral timeline with timestamps
- AI specialist suggestion engine
- Specialist report processing with GPT-4o action item extraction
- Two role views: Family Doctor and Specialist
- Synthea synthetic patient data (8 Ottawa patients)
- 10 real Ottawa specialists seeded with wait times and contact info

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, TypeScript, Tailwind CSS, shadcn/ui, SWR |
| Backend | Node.js, Express, Supabase (PostgreSQL) |
| AI — Transcription | OpenAI Whisper API |
| AI — Clinical NLP | OpenAI GPT-4o |
| AI — Speaker Diarization | pyannote.audio 3.3.2 |
| Audio Service | Python FastAPI microservice |
| Database | Supabase (hosted PostgreSQL) |
| Patient Data | Synthea synthetic health records |

---

## Project Structure

```
healthcare-hackathon/
├── backend/
│   ├── src/
│   │   ├── server.js           # Express entry point (port 3001)
│   │   ├── routes/
│   │   │   ├── referrals.js    # Referral CRUD + AI suggest
│   │   │   ├── specialists.js  # Specialist lookup
│   │   │   └── transcribe.js   # Audio forwarding to Python
│   │   ├── services/
│   │   │   └── openai.js       # GPT-4o extraction functions
│   │   └── db/
│   │       ├── supabase.js     # Supabase client
│   │       └── store.js        # All DB queries
│   ├── supabase/
│   │   └── schema.sql          # Full schema + seed data
│   └── python-service/
│       └── main.py             # FastAPI Whisper + pyannote service
└── frontend/
    ├── app/
    │   ├── page.tsx            # Doctor dashboard
    │   ├── appointment/        # Live recording page
    │   ├── referrals/          # Referral detail + timeline
    │   └── specialist/         # Specialist view
    └── components/
        ├── create-referral-modal.tsx
        ├── timeline.tsx
        └── report-uploader.tsx
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10–3.12
- A Supabase project
- OpenAI API key
- HuggingFace token (for pyannote speaker diarization)

### 1. Clone the repo

```bash
git clone https://github.com/mahadmyonis/healthcare-hackathon.git
cd healthcare-hackathon
```

### 2. Set up the database

Run `backend/supabase/schema.sql` in your Supabase SQL Editor. This creates all tables and seeds 8 patients, 10 specialists, and 6 demo referrals.

Then disable RLS for the hackathon demo:

```sql
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE referrals DISABLE ROW LEVEL SECURITY;
ALTER TABLE specialists DISABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events DISABLE ROW LEVEL SECURITY;
```

### 3. Start the Node backend

```bash
cd backend
cp .env.example .env   # fill in your keys
npm install
npm run dev            # runs on port 3001
```

`.env` needs:
```
OPENAI_API_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
PORT=3001
PYTHON_SERVICE_URL=http://localhost:8000
```

### 4. Start the Python audio service

```bash
cd backend/python-service
py -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

`.env` needs:
```
OPENAI_API_KEY=
HUGGINGFACE_TOKEN=
PORT=8000
```

### 5. Start the frontend

```bash
cd frontend
pnpm install
pnpm approve-builds
pnpm dev               # runs on port 3000
```

Open `http://localhost:3000`

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/patients` | List all patients |
| GET | `/api/referrals` | List all referrals |
| POST | `/api/referrals` | Create referral |
| PATCH | `/api/referrals/:id/status` | Update referral status |
| GET | `/api/referrals/:id/timeline` | Full status timeline |
| POST | `/api/referrals/:id/report` | Submit specialist report + AI extraction |
| POST | `/api/referrals/suggest-specialist` | AI specialist suggestion |
| POST | `/api/transcribe` | Transcribe audio (Whisper + pyannote) |
| POST | `/api/transcribe/text` | Extract clinical notes from transcript |

---

## Team

Built by **Mahad** and **Hassan** at the AI in Healthcare Hackathon, Invest Ottawa — June 20, 2026.

---

## License

MIT
