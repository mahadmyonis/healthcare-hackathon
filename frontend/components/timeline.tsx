import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { fmtDate } from "@/lib/ui"
import type { ReferralStatus, TimelineEvent } from "@/lib/types"

const STEPS: { key: ReferralStatus; label: string }[] = [
  { key: "pending", label: "Referral Sent" },
  { key: "received", label: "Received" },
  { key: "scheduled", label: "Scheduled" },
  { key: "seen", label: "Patient Seen" },
  { key: "report_submitted", label: "Report Submitted" },
  { key: "closed", label: "Closed" },
]

export function TimelineStepper({
  status,
  timeline,
}: {
  status: ReferralStatus
  timeline: TimelineEvent[]
}) {
  const order = STEPS.map((s) => s.key)
  // rejected / needs_* are handled by banners; map them onto the closest mainline step
  const currentIndex = order.indexOf(status as ReferralStatus)
  const effectiveIndex = currentIndex === -1 ? 1 : currentIndex

  const dateFor = (key: ReferralStatus) => fmtDate(timeline.find((t) => t.status === key)?.created_at)

  return (
    <div className="flex items-start justify-between gap-1 overflow-x-auto pb-2">
      {STEPS.map((step, i) => {
        const done = i < effectiveIndex
        const current = i === effectiveIndex
        const hasDate = timeline.some((t) => t.status === step.key)
        return (
          <div key={step.key} className="flex flex-1 items-start">
            <div className="flex min-w-20 flex-col items-center text-center">
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-full border-2 text-xs font-semibold",
                  done && "border-primary bg-primary text-primary-foreground",
                  current && "border-primary bg-emerald-50 text-primary animate-pulse",
                  !done && !current && "border-border bg-muted text-muted-foreground",
                )}
              >
                {done ? <Check className="size-4" /> : i + 1}
              </span>
              <span className={cn("mt-2 text-xs font-medium", done || current ? "text-foreground" : "text-muted-foreground")}>
                {step.label}
              </span>
              <span className="text-[11px] text-muted-foreground">{hasDate ? dateFor(step.key) : ""}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn("mt-4 h-0.5 flex-1", i < effectiveIndex ? "bg-primary" : "bg-border")} />
            )}
          </div>
        )
      })}
    </div>
  )
}
