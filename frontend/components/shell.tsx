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
  Menu,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useRole, type Role } from "@/components/role-context"
import { Avatar } from "@/components/bits"

const DOCTOR_NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/patients", label: "Patients", icon: Users },
  { href: "/#referrals", label: "Referrals", icon: ClipboardList },
  { href: "/appointment", label: "Record", icon: Mic },
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const nav = role === "doctor" ? DOCTOR_NAV : SPECIALIST_NAV

  const switchRole = (r: Role) => {
    setRole(r)
    router.push(r === "doctor" ? "/" : "/specialist")
    setMobileMenuOpen(false)
  }

  const isActive = (href: string) =>
    pathname === href.split("?")[0].split("#")[0] && href !== "/#referrals"

  return (
    <div className="flex min-h-screen bg-background">

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border bg-card">
        <div className="flex items-center gap-2 px-6 py-5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Activity className="size-5" />
          </span>
          <span className="text-lg font-bold tracking-tight text-foreground">LoopMD</span>
        </div>
        <nav className="flex flex-col gap-1 px-3">
          {nav.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "bg-emerald-50 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
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

      {/* ── Mobile slide-in menu overlay ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-72 flex flex-col bg-card shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Activity className="size-5" />
                </span>
                <span className="text-lg font-bold tracking-tight text-foreground">LoopMD</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
                aria-label="Close menu"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Role switcher */}
            <div className="px-4 py-3 border-b border-border">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Role</p>
              <div className="flex rounded-full border border-border bg-muted p-0.5 text-sm font-medium">
                {(["doctor", "specialist"] as Role[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => switchRole(r)}
                    className={cn(
                      "flex-1 rounded-full py-1.5 capitalize transition-colors",
                      role === r ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <nav className="flex flex-col gap-1 px-3 py-3">
              {nav.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                    isActive(item.href)
                      ? "bg-emerald-50 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <item.icon className="size-5" />
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="mt-auto border-t border-border px-4 py-4">
              <div className="flex items-center gap-3">
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
        </div>
      )}

      {/* ── Main content ── */}
      <div className="flex min-w-0 flex-1 flex-col">

        {/* Top header */}
        <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 md:px-6">
          {/* Mobile: hamburger + logo */}
          <button
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted md:hidden"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>
          <div className="flex items-center gap-2 md:hidden">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Activity className="size-4" />
            </span>
            <span className="text-base font-bold tracking-tight text-foreground">LoopMD</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Role switcher — desktop only */}
            <div className="hidden md:flex rounded-full border border-border bg-muted p-0.5 text-sm font-medium">
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

            {/* Bell */}
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
                <div className="absolute right-0 top-12 z-50 w-72 rounded-xl border border-border bg-card p-2 shadow-lg">
                  <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Notifications
                  </p>
                  {NOTIFICATIONS.map((n) => (
                    <div key={n} className="rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-muted">
                      {n}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 pb-24 md:p-6 md:pb-6">
          {children}
        </main>
      </div>

      {/* ── Mobile bottom tab bar ── */}
      <nav className="fixed bottom-0 inset-x-0 z-40 flex border-t border-border bg-card md:hidden">
        {nav.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors",
              isActive(item.href) ? "text-primary" : "text-muted-foreground",
            )}
          >
            <item.icon className={cn("size-5", isActive(item.href) && "stroke-[2.5]")} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
