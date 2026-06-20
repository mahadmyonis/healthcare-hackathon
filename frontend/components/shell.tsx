"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import {
  Activity,
  Bell,
  CheckCircle2,
  LayoutDashboard,
  Mic,
  Users,
  XCircle,
  ClipboardList,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useRole, type Role } from "@/components/role-context"
import { Avatar } from "@/components/bits"

const DOCTOR_NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/patients", label: "Patients", icon: Users },
  { href: "/#referrals", label: "Referrals", icon: ClipboardList },
  { href: "/appointment", label: "New Appointment", icon: Mic },
]

const SPECIALIST_NAV = [
  { href: "/specialist", label: "My Patients", icon: Users },
  { href: "/specialist?filter=completed", label: "Completed", icon: CheckCircle2 },
  { href: "/specialist?filter=rejected", label: "Rejected", icon: XCircle },
]

const NOTIFICATIONS = [
  "Dr. Hosseini scheduled Margaret Chen — June 18",
  "Report ready for Margaret Chen — review now",
  "Ahmed Hassan referral rejected",
]

export function Shell({ children }: { children: React.ReactNode }) {
  const { role, setRole, name } = useRole()
  const pathname = usePathname()
  const router = useRouter()
  const [bellOpen, setBellOpen] = useState(false)
  const nav = role === "doctor" ? DOCTOR_NAV : SPECIALIST_NAV

  const switchRole = (r: Role) => {
    setRole(r)
    router.push(r === "doctor" ? "/" : "/specialist")
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-card">
        <div className="flex items-center gap-2 px-6 py-5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Activity className="size-5" />
          </span>
          <span className="text-lg font-bold tracking-tight text-foreground">LoopMD</span>
        </div>
        <nav className="flex flex-col gap-1 px-3">
          {nav.map((item) => {
            const active = pathname === item.href.split("?")[0].split("#")[0] && item.href !== "/#referrals"
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-emerald-50 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="mt-auto border-t border-border px-4 py-4">
          <div className="flex items-center gap-2">
            <Avatar name={name} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {role === "doctor" ? "Family Medicine" : "Cardiologist"}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-end gap-3 border-b border-border bg-card px-6 py-3">
          <div className="flex rounded-full border border-border bg-muted p-0.5 text-sm font-medium">
            {(["doctor", "specialist"] as Role[]).map((r) => (
              <button
                key={r}
                onClick={() => switchRole(r)}
                className={cn(
                  "rounded-full px-4 py-1.5 capitalize transition-colors",
                  role === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="relative">
            <button
              onClick={() => setBellOpen((o) => !o)}
              className="relative rounded-full border border-border bg-card p-2 text-muted-foreground hover:text-foreground"
              aria-label="Notifications"
            >
              <Bell className="size-5" />
              <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary" />
            </button>
            {bellOpen && (
              <div className="absolute right-0 top-12 z-50 w-80 rounded-xl border border-border bg-card p-2 shadow-lg">
                <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Notifications
                </p>
                {NOTIFICATIONS.map((n) => (
                  <div key={n} className="rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted">
                    {n}
                  </div>
                ))}
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
