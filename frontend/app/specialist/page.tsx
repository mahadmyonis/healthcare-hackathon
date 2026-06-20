"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import useSWR from "swr"
import { CheckCircle2, ClipboardList, FileClock, CalendarCheck } from "lucide-react"
import { Shell } from "@/components/shell"
import { Card, StatusBadge } from "@/components/bits"
import { KanbanCard } from "@/components/kanban-card"
import { useRole } from "@/components/role-context"
import { fetcher } from "@/lib/swr"
import { age, fmtDate } from "@/lib/ui"
import { cn } from "@/lib/utils"
import type { Referral, ReferralStatus } from "@/lib/types"

const COLUMNS: { key: ReferralStatus; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "scheduled", label: "Scheduled" },
  { key: "seen", label: "Seen" },
  { key: "report_submitted", label: "Report Submitted" },
]

function Stat({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) {
  return (
    <Card className="flex items-center gap-4">
      <span className="flex size-11 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </span>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </Card>
  )
}

function SpecialistInner() {
  const { role } = useRole()
  const router = useRouter()
  const filter = useSearchParams().get("filter")
  const { data, mutate } = useSWR<{ referrals: Referral[] }>("/api/referrals", fetcher)

  useEffect(() => {
    if (role === "doctor") router.replace("/")
  }, [role, router])

  const referrals = data?.referrals ?? []
  const count = (s: ReferralStatus) => referrals.filter((r) => r.status === s).length

  if (filter === "completed" || filter === "rejected") {
    const status: ReferralStatus = filter === "completed" ? "closed" : "rejected"
    const list = referrals.filter((r) => (filter === "completed" ? r.status === "closed" || r.status === "report_submitted" : r.status === "rejected"))
    return (
      <Shell>
        <h1 className="mb-6 text-2xl font-bold capitalize text-foreground">{filter}</h1>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {list.length === 0 && <p className="p-6 text-sm text-muted-foreground">Nothing here yet.</p>}
          {list.map((r) => (
            <Link key={r.id} href={`/specialist/referrals/${r.id}`} className="flex items-center justify-between border-b border-border px-4 py-3 last:border-0 hover:bg-muted/50">
              <div>
                <p className="font-medium text-foreground">{r.patients?.name}</p>
                <p className="text-sm text-muted-foreground">{r.specialistType} · {fmtDate(r.created_at)}</p>
              </div>
              <StatusBadge status={r.status} />
            </Link>
          ))}
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">My Patients</h1>
        <p className="text-muted-foreground">Dr. Amir Hosseini · Cardiology</p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="New Referrals" value={count("pending")} icon={ClipboardList} />
        <Stat label="Scheduled" value={count("scheduled")} icon={CalendarCheck} />
        <Stat label="Awaiting Report" value={count("seen")} icon={FileClock} />
        <Stat label="Completed" value={count("report_submitted") + count("closed")} icon={CheckCircle2} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const items = referrals.filter((r) => r.status === col.key)
          return (
            <div key={col.key} className="rounded-xl bg-muted/40 p-3">
              <div className="mb-3 flex items-center justify-between px-1">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{col.label}</h2>
                <span className="rounded-full bg-card px-2 py-0.5 text-xs font-medium text-muted-foreground">{items.length}</span>
              </div>
              <div className="flex flex-col gap-2">
                {items.length === 0 && <p className="px-1 text-xs text-muted-foreground">Empty</p>}
                {items.map((r) => (
                  <KanbanCard key={r.id} referral={r} onChange={mutate} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </Shell>
  )
}

export default function SpecialistDashboard() {
  return (
    <Suspense fallback={<Shell><p className="text-muted-foreground">Loading…</p></Shell>}>
      <SpecialistInner />
    </Suspense>
  )
}
