"use client"

import { useEffect, useRef, useState } from "react"
import useSWR from "swr"
import { Activity, ArrowRight, Mic, Square, Loader2 } from "lucide-react"
import { Shell } from "@/components/shell"
import { Card } from "@/components/bits"
import { CreateReferralModal } from "@/components/create-referral-modal"
import { fetcher } from "@/lib/swr"
import { cn } from "@/lib/utils"
import type { Patient } from "@/lib/types"

type ClinicalNotes = {
  symptoms?: string[]
  duration?: string
  severity?: string
  relevantHistory?: string
  urgencyAssessment?: string
  urgencyReason?: string
  recommendedAction?: string
  suggestedSpecialistType?: string
  referralReason?: string
  redFlags?: string[]
  doctorObservations?: string
  patientConcerns?: string
}

type Phase = "idle" | "recording" | "processing" | "done" | "error"

// Web Speech API types
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

export default function AppointmentPage() {
  const { data } = useSWR<{ patients: Patient[] }>("/api/patients", fetcher)
  const patients = data?.patients ?? []
  const [patientId, setPatientId] = useState("")
  const [phase, setPhase] = useState<Phase>("idle")
  const [seconds, setSeconds] = useState(0)
  const [liveText, setLiveText] = useState("")        // shown while recording
  const [finalTranscript, setFinalTranscript] = useState("") // committed words
  const [interimTranscript, setInterimTranscript] = useState("") // in-progress words
  const [notes, setNotes] = useState<ClinicalNotes | null>(null)
  const [error, setError] = useState("")
  const [modalOpen, setModalOpen] = useState(false)

  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const finalRef = useRef("") // track committed text without stale closure

  useEffect(() => {
    if (patients.length > 0 && !patientId) setPatientId(patients[0].id)
  }, [patients, patientId])

  const selectedPatient = patients.find((p) => p.id === patientId) ?? null

  const startRecording = async () => {
    setError("")
    setLiveText("")
    setFinalTranscript("")
    setInterimTranscript("")
    setNotes(null)
    setSeconds(0)
    finalRef.current = ""

    // 1. Mic audio for Whisper
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setError("Microphone access denied. Please allow microphone access and try again.")
      return
    }

    chunksRef.current = []
    const mr = new MediaRecorder(stream, { mimeType: "audio/webm" })
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    mr.start(250)
    mediaRef.current = mr

    // 2. Web Speech API for live display
    const SpeechRecognition = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = "en-CA"

      recognition.onresult = (event) => {
        let interim = ""
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          if (result.isFinal) {
            finalRef.current += result[0].transcript + " "
            setFinalTranscript(finalRef.current)
          } else {
            interim += result[0].transcript
          }
        }
        setInterimTranscript(interim)
      }

      recognition.onerror = () => { /* silently ignore — Whisper is source of truth */ }
      recognition.start()
      recognitionRef.current = recognition
    }

    setPhase("recording")
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000)
  }

  const stopRecording = () => {
    if (!mediaRef.current) return
    clearInterval(timerRef.current!)

    // Stop live speech recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }

    mediaRef.current.stop()
    mediaRef.current.stream.getTracks().forEach((t) => t.stop())
    setInterimTranscript("")
    setPhase("processing")

    mediaRef.current.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" })
      await sendToWhisper(blob)
    }
  }

  const sendToWhisper = async (blob: Blob) => {
    try {
      const patientHistory = selectedPatient
        ? `Conditions: ${selectedPatient.conditions.join(", ")}. Medications: ${selectedPatient.medications.join(", ")}. Allergies: ${selectedPatient.allergies.join(", ")}.`
        : ""

      const form = new FormData()
      form.append("audio", blob, "recording.webm")
      form.append("patient_history", patientHistory)

      const res = await fetch("http://localhost:8000/transcribe", {
        method: "POST",
        body: form,
      })

      if (!res.ok) throw new Error(`Transcription failed: ${res.status}`)
      const data = await res.json()

      // Replace live transcript with Whisper's cleaner version
      setFinalTranscript(data.transcript ?? finalRef.current)
      setNotes(data.clinical_notes ?? null)
      setPhase("done")
    } catch (e) {
      setError(String(e))
      setPhase("error")
    }
  }

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`

  const urgencyColor = (u?: string) => {
    if (!u) return "bg-gray-100 text-gray-700"
    if (/emergent/i.test(u)) return "bg-red-100 text-red-700"
    if (/urgent/i.test(u)) return "bg-orange-100 text-orange-700"
    return "bg-emerald-100 text-emerald-700"
  }

  const displayText = finalTranscript + interimTranscript

  return (
    <Shell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Active Appointment</h1>
        <p className="text-muted-foreground">AI-assisted clinical documentation</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* LEFT: recording + transcript */}
        <Card className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="patient-select" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Patient
            </label>
            <select
              id="patient-select"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              disabled={phase === "recording"}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none disabled:opacity-50"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Status bar */}
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-3">
            <span className="relative flex size-4">
              {phase === "recording" && (
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-75" />
              )}
              <span className={cn(
                "relative inline-flex size-4 rounded-full",
                phase === "recording" ? "bg-red-500" :
                phase === "processing" ? "bg-yellow-500" :
                phase === "done" ? "bg-primary" : "bg-muted-foreground/40"
              )} />
            </span>
            <span className="flex-1 text-sm font-medium text-foreground">
              {phase === "idle" && "Ready to record"}
              {phase === "recording" && `Recording… ${fmt(seconds)}`}
              {phase === "processing" && "Whisper is transcribing…"}
              {phase === "done" && "Session complete"}
              {phase === "error" && "Error occurred"}
            </span>

            {phase === "idle" && (
              <button
                onClick={startRecording}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-emerald-600"
              >
                <Mic className="size-4" /> Start Session
              </button>
            )}
            {phase === "recording" && (
              <button
                onClick={stopRecording}
                className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-600"
              >
                <Square className="size-3.5 fill-current" /> Stop
              </button>
            )}
            {phase === "processing" && (
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            )}
            {(phase === "done" || phase === "error") && (
              <button
                onClick={() => { setPhase("idle"); setFinalTranscript(""); setInterimTranscript(""); setNotes(null); setError("") }}
                className="text-xs text-muted-foreground underline"
              >
                Reset
              </button>
            )}
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          )}

          {/* Live transcript */}
          <div className="min-h-64 flex-1 rounded-lg border border-border bg-background p-4 text-sm leading-relaxed text-foreground overflow-y-auto">
            {displayText ? (
              <span className="whitespace-pre-wrap">
                {finalTranscript}
                {interimTranscript && (
                  <span className="text-muted-foreground/60 italic">{interimTranscript}</span>
                )}
                {phase === "recording" && (
                  <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-primary align-middle" />
                )}
              </span>
            ) : (
              <span className="text-muted-foreground">
                {phase === "processing" ? "Processing with Whisper AI…" : "Transcript will appear live as you speak…"}
              </span>
            )}
          </div>

          {phase === "done" && (
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-emerald-600"
            >
              Create Referral from Notes <ArrowRight className="size-4" />
            </button>
          )}
        </Card>

        {/* RIGHT: AI clinical notes */}
        <Card className="border-l-4 border-primary">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="size-5 text-primary" />
            <h2 className="font-semibold text-foreground">AI Clinical Notes</h2>
          </div>

          {phase === "idle" && (
            <p className="text-sm text-muted-foreground">Notes will populate after the session ends.</p>
          )}
          {phase === "recording" && (
            <p className="text-sm text-muted-foreground">Recording in progress — AI notes appear when you stop.</p>
          )}
          {phase === "processing" && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Analyzing with GPT-4o…
            </div>
          )}

          {notes && (
            <div className="space-y-4 text-sm">
              {notes.symptoms && notes.symptoms.length > 0 && (
                <NoteRow label="Symptoms">
                  <div className="flex flex-wrap gap-1.5">
                    {notes.symptoms.map((s) => (
                      <span key={s} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">{s}</span>
                    ))}
                  </div>
                </NoteRow>
              )}
              {notes.duration && (
                <NoteRow label="Duration">
                  <span className="text-muted-foreground">{notes.duration}</span>
                </NoteRow>
              )}
              {notes.severity && (
                <NoteRow label="Severity">
                  <span className="text-muted-foreground capitalize">{notes.severity}</span>
                </NoteRow>
              )}
              {notes.urgencyAssessment && (
                <NoteRow label="Urgency">
                  <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold", urgencyColor(notes.urgencyAssessment))}>
                    {notes.urgencyAssessment.toUpperCase()}
                  </span>
                  {notes.urgencyReason && <p className="mt-1 text-xs text-muted-foreground">{notes.urgencyReason}</p>}
                </NoteRow>
              )}
              {notes.suggestedSpecialistType && (
                <NoteRow label="Suggested Specialist">
                  <span className="font-medium text-primary">{notes.suggestedSpecialistType}</span>
                </NoteRow>
              )}
              {notes.redFlags && notes.redFlags.length > 0 && (
                <NoteRow label="Red Flags">
                  <div className="flex flex-wrap gap-1.5">
                    {notes.redFlags.map((f) => (
                      <span key={f} className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">{f}</span>
                    ))}
                  </div>
                </NoteRow>
              )}
              {notes.referralReason && (
                <NoteRow label="Referral Reason">
                  <p className="text-muted-foreground leading-relaxed">{notes.referralReason}</p>
                </NoteRow>
              )}
              {notes.recommendedAction && (
                <NoteRow label="Recommended Action">
                  <p className="text-muted-foreground">{notes.recommendedAction}</p>
                </NoteRow>
              )}
            </div>
          )}
        </Card>
      </div>

      <CreateReferralModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        patient={selectedPatient}
        defaultReason={notes?.referralReason ?? ""}
        defaultSpecialist={notes?.suggestedSpecialistType ?? ""}
      />
    </Shell>
  )
}

function NoteRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="animate-in fade-in">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}
