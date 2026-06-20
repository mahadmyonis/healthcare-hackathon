"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, Loader2, Sparkles } from "lucide-react"
import { Modal } from "@/components/modal"
import { useToast } from "@/components/toast"
import { sendJSON } from "@/lib/ui"
import type { Patient, Referral } from "@/lib/types"

interface Suggestion {
  specialistType: string
  rationale: string
  alternativeSpecialist: string
  estimatedWaitWeeks: number
  warningFlags: string[]
}

export function CreateReferralModal({
  open,
  onClose,
  patient,
  defaultReason,
  defaultSpecialist,
}: {
  open: boolean
  onClose: () => void
  patient: Patient | null
  defaultReason: string
  defaultSpecialist: string
}) {
  const router = useRouter()
  const toast = useToast()
  const [reason, setReason] = useState(defaultReason)
  const [specialistType, setSpecialistType] = useState(defaultSpecialist)
  const [urgency, setUrgency] = useState("urgent")
  const [suggesting, setSuggesting] = useState(false)
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null)
  const [sending, setSending] = useState(false)

  // keep fields in sync when AI notes change
  if (open && reason === "" && defaultReason) setReason(defaultReason)

  const suggest = async () => {
    setSuggesting(true)
    setSuggestion(null)
    try {
      const { suggestion } = await sendJSON<{ suggestion: Suggestion }>("/api/referrals/suggest-specialist", "POST", {
        reason,
        patientHistory: patient ? `${patient.conditions.join(", ")}; meds: ${patient.medications.join(", ")}` : "",
        location: "Toronto",
      })
      setSuggestion(suggestion)
      if (!specialistType) setSpecialistType(suggestion.specialistType)
    } finally {
      setSuggesting(false)
    }
  }

  const confirm = async () => {
    if (!patient) return
    setSending(true)
    try {
      const { referral } = await sendJSON<{ referral: Referral }>("/api/referrals", "POST", {
        patientId: patient.id,
        referringDoctor: "Dr. Sarah Chen",
        specialistType,
        reason,
        urgency,
        appointmentNotes: defaultReason,
      })
      toast("Referral sent to specialist")
      router.push(`/referrals/${referral.id}`)
    } finally {
      setSending(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create Referral">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Patient">
            <span className="text-sm font-medium text-foreground">{patient?.name ?? "—"}</span>
          </Field>
          <Field label="Referring Doctor">
            <span className="text-sm text-muted-foreground">Dr. Sarah Chen</span>
          </Field>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Reason</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Urgency</label>
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              <option value="routine">Routine</option>
              <option value="urgent">Urgent</option>
              <option value="emergent">Emergent</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Specialist Type</label>
            <input
              value={specialistType}
              onChange={(e) => setSpecialistType(e.target.value)}
              placeholder="e.g. Cardiology"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <button
          onClick={suggest}
          disabled={suggesting}
          className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-primary hover:bg-emerald-100 disabled:opacity-60"
        >
          {suggesting ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          Suggest Specialist with AI
        </button>

        {suggestion && (
          <div className="rounded-lg border-l-4 border-primary bg-emerald-50/60 p-3 text-sm">
            <p className="font-semibold text-foreground">
              {suggestion.specialistType}
              <span className="ml-2 font-normal text-muted-foreground">~{suggestion.estimatedWaitWeeks} wk wait</span>
            </p>
            <p className="mt-1 text-muted-foreground">{suggestion.rationale}</p>
            <p className="mt-1 text-xs text-muted-foreground">Alternative: {suggestion.alternativeSpecialist}</p>
            {suggestion.warningFlags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {suggestion.warningFlags.map((f) => (
                  <span key={f} className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                    <AlertTriangle className="size-3" /> {f}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <button
          onClick={confirm}
          disabled={sending || !patient || !specialistType}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-emerald-600 disabled:opacity-60"
        >
          {sending && <Loader2 className="size-4 animate-spin" />}
          Confirm & Send Referral
        </button>
      </div>
    </Modal>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  )
}
