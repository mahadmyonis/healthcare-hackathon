"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { FileCheck, FolderCheck, ClipboardList, Clock } from "lucide-react"
import { Shell } from "@/components/shell"
import { Avatar, Card, StatusBadge, UrgencyBadge } from "@/components/bits"
import { useRole } from "@/components/role-context"
import { fetcher } from "@/lib/swr"
import { age, fmtDate } from "@/lib/ui"
import { cn } from "@/lib/utils"
import type { Referral, ReferralStatus } from "@/lib/types"

const TABS: { label: string; match: (r: Referral) => boolean }[] = [
  { label: "All", match: () => true },
  { label: "Pending", match: (r) => r.status === "pending" },
  { label: "Scheduled", match: (r) => r.status === "scheduled" },
  { label: "Needs Attention", match: (r) => r.status === "needs_attention" },
  { label: "Report Ready", match: (r) => r.status === "report_submitted" },
  { label: "Closed", match: (r) => r.status === "closed" },
  { label: "Rejected", match: (r) => r.status === "rejected" },
]

function Stat({ label, value, icon: Icon, highlight }: { label: string; value: number; icon: React.ElementType; highlight?: boolean }) {
  return (
    <Card className={cn("flex items-center gap-4", highlight && "border-emerald-200 bg-emerald-50")}>
      <span className={cn("flex size-11 items-center justify-center rounded-lg", highlight ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
        <Icon className="size-5" />
      </span>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </Card>
  )
}

export default function DoctorDashboard() {
  const { role } = useRole()
  const router = useRouter()
  const [tab, setTab] = useState("All")
  const { data } = useSWR<{ referrals: Referral[] }>("/api/referrals", fetcher)

  useEffect(() => {
    if (role === "specialist") router.replace("/specialist")
  }, [role, router])

  const referrals = data?.referrals ?? []
  const count = (s: ReferralStatus) => referrals.filter((r) => r.status === s).length
  const filtered = useMemo(() => referrals.filter(TABS.find((t) => t.label === tab)!.match), [referrals, tab])

  return (
    <Shell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, Dr. Sarah Chen</p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total Referrals" value={referrals.length} icon={ClipboardList} />
        <Stat label="Pending" value={count("pending")} icon={Clock} />
        <Stat label="Reports Ready" value={count("report_submitted")} icon={FileCheck} highlight />
        <Stat label="Closed" value={count("closed")} icon={FolderCheck} />
      </div>

      <div id="referrals" className="mb-3 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.label}
            onClick={() => setTab(t.label)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              tab === t.label ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {filtered.length === 0 && <p className="p-6 text-sm text-muted-foreground">No referrals in this view.</p>}
        {filtered.map((r) => (
          <Link
            key={r.id}
            href={`/referrals/${r.id}`}
            className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-0 hover:bg-muted/50"
          >
            <Avatar name={r.patients?.name ?? "?"} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-foreground">
                {r.patients?.name}
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  · {r.patients ? age(r.patients.dob) : "?"}y
                </span>
              </p>
              <p className="truncate text-sm text-muted-foreground">{r.specialistType}</p>
            </div>
            <UrgencyBadge urgency={r.urgency} />
            <StatusBadge status={r.status} />
            <span className="hidden w-24 text-right text-sm text-muted-foreground sm:block">{fmtDate(r.created_at)}</span>
          </Link>
        ))}
      </div>
    </Shell>
  )
}
