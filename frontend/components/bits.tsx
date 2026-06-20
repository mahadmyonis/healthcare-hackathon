import { cn } from "@/lib/utils"
import { initials, STATUS_LABELS, STATUS_STYLES, URGENCY_STYLES } from "@/lib/ui"
import type { ReferralStatus } from "@/lib/types"

export function StatusBadge({ status, className }: { status: ReferralStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        STATUS_STYLES[status],
        className,
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}

export function UrgencyBadge({ urgency }: { urgency: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        URGENCY_STYLES[urgency] || URGENCY_STYLES.routine,
      )}
    >
      {urgency}
    </span>
  )
}

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const dims = size === "lg" ? "size-14 text-lg" : size === "sm" ? "size-8 text-xs" : "size-10 text-sm"
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-emerald-100 font-semibold text-emerald-700",
        dims,
      )}
    >
      {initials(name)}
    </span>
  )
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-xl border border-border bg-card p-5", className)}>{children}</div>
}
