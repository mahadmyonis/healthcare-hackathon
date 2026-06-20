"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Modal } from "@/components/modal"
import { useToast } from "@/components/toast"
import { UrgencyBadge } from "@/components/bits"
import { sendJSON } from "@/lib/ui"
import { age, fmtDate } from "@/lib/ui"
import type { Referral } from "@/lib/types"

const REJECT_REASONS = [
  "Incomplete referral — missing recent labs or imaging",
  "Patient out of catchment area",
  "Not appropriate for this specialty",
  "Duplicate referral",
]

export function KanbanCard({ referral, onChange }: { referral: Referral; onChange: () => void }) {
  const toast = useToast()
  const router = useRouter()
  const [modal, setModal] = useState<null | "schedule" | "info" | "reject">(null)
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [note, setNote] = useState("")
  const [reason, setReason] = useState(REJECT_REASONS[0])

  const patch = async (status: string, n: string) => {
    await sendJSON(`/api/referrals/${referral.id}/status`, "PATCH", {
      status,
      triggeredBy: "Dr. Amir Hosseini",
      note: n,
    })
    setModal(null)
    onChange()
  }

  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
      <div className="mb-1 flex items-center justify-between">
        <Link href={`/specialist/referrals/${referral.id}`} className="font-medium text-foreground hover:text-primary">
          {referral.patients?.name}
          <span className="ml-1 text-xs font-normal text-muted-foreground">· {referral.patients ? age(referral.patients.dob) : "?"}y</span>
        </Link>
        <UrgencyBadge urgency={referral.urgency} />
      </div>
      <p className="text-xs text-muted-foreground">{referral.referringDoctor}</p>
      <p className="mt-1 line-clamp-2 text-sm text-foreground">{referral.reason}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">Received {fmtDate(referral.created_at)}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {referral.status === "pending" && (
          <>
            <CardBtn onClick={() => setModal("schedule")}>Schedule</CardBtn>
            <CardBtn onClick={() => setModal("info")} variant="muted">Request Info</CardBtn>
            <CardBtn onClick={() => setModal("reject")} variant="danger">Reject</CardBtn>
          </>
        )}
        {referral.status === "scheduled" && (
          <CardBtn onClick={() => patch("seen", "Patient seen by specialist.")}>Mark as Seen</CardBtn>
        )}
        {referral.status === "seen" && (
          <CardBtn onClick={() => router.push(`/specialist/referrals/${referral.id}`)}>Submit Report</CardBtn>
        )}
      </div>

      <Modal open={modal === "schedule"} onClose={() => setModal(null)} title="Schedule Appointment">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
          </div>
          <button onClick={() => patch("scheduled", `Scheduled for ${date} ${time}`)} disabled={!date} className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-emerald-600 disabled:opacity-60">
            Confirm Schedule
          </button>
        </div>
      </Modal>

      <Modal open={modal === "info"} onClose={() => setModal(null)} title="Request Information">
        <div className="space-y-3">
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="What information do you need?" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
          <button onClick={() => patch("needs_attention", note)} disabled={!note} className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-emerald-600 disabled:opacity-60">
            Send Request
          </button>
        </div>
      </Modal>

      <Modal open={modal === "reject"} onClose={() => setModal(null)} title="Reject Referral">
        <div className="space-y-3">
          <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
            {REJECT_REASONS.map((r) => <option key={r}>{r}</option>)}
          </select>
          <button onClick={() => patch("rejected", reason)} className="w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
            Reject Referral
          </button>
        </div>
      </Modal>
    </div>
  )
}

function CardBtn({ children, onClick, variant }: { children: React.ReactNode; onClick: () => void; variant?: "muted" | "danger" }) {
  const styles =
    variant === "danger"
      ? "border-red-200 text-red-600 hover:bg-red-50"
      : variant === "muted"
        ? "border-border text-muted-foreground hover:bg-muted"
        : "border-emerald-200 bg-emerald-50 text-primary hover:bg-emerald-100"
  return (
    <button onClick={onClick} className={`rounded-md border px-2.5 py-1 text-xs font-medium ${styles}`}>
      {children}
    </button>
  )
}
