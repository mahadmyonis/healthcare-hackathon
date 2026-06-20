"use client"

import Link from "next/link"
import useSWR from "swr"
import { Shell } from "@/components/shell"
import { Avatar } from "@/components/bits"
import { fetcher } from "@/lib/swr"
import { age, fmtDate } from "@/lib/ui"
import type { Patient } from "@/lib/types"

export default function PatientsPage() {
  const { data } = useSWR<{ patients: Patient[] }>("/api/patients", fetcher)
  const patients = data?.patients ?? []

  return (
    <Shell>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Patients</h1>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Age</th>
              <th className="px-4 py-3 font-medium">Conditions</th>
              <th className="px-4 py-3 font-medium">Last Visit</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                <td className="px-4 py-3">
                  <Link href={`/patients/${p.id}`} className="flex items-center gap-3 font-medium text-foreground">
                    <Avatar name={p.name} size="sm" />
                    {p.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{age(p.dob)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {p.conditions.map((c) => (
                      <span key={c} className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        {c}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{fmtDate(p.last_visit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  )
}
