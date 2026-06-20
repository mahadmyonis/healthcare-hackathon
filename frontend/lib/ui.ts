import type { ReferralStatus } from "./types"

export const STATUS_LABELS: Record<ReferralStatus, string> = {
  pending: "Pending",
  received: "Received",
  scheduled: "Scheduled",
  seen: "Seen",
  needs_attention: "Needs Attention",
  needs_reschedule: "Needs Reschedule",
  report_submitted: "Report Submitted",
  rejected: "Rejected",
  closed: "Closed",
}

// Tailwind classes per status (pill badges)
export const STATUS_STYLES: Record<ReferralStatus, string> = {
  pending: "bg-blue-100 text-blue-700",
  received: "bg-sky-100 text-sky-700",
  scheduled: "bg-purple-100 text-purple-700",
  seen: "bg-teal-100 text-teal-700",
  needs_attention: "bg-amber-100 text-amber-700",
  needs_reschedule: "bg-orange-100 text-orange-700",
  report_submitted: "bg-yellow-100 text-yellow-800",
  rejected: "bg-red-100 text-red-700",
  closed: "bg-emerald-100 text-emerald-700",
}

export const URGENCY_STYLES: Record<string, string> = {
  routine: "bg-slate-100 text-slate-600",
  urgent: "bg-red-100 text-red-700",
  emergent: "bg-red-200 text-red-800",
}

export function age(dob: string): number {
  const d = new Date(dob)
  const diff = Date.now() - d.getTime()
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000))
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export function fmtDate(iso?: string): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}

export async function sendJSON<T>(url: string, method: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}
