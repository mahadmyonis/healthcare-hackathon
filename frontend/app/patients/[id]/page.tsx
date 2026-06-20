"use client"

import { use } from "react"
import Link from "next/link"
import useSWR from "swr"
import { ArrowLeft } from "lucide-react"
import { Shell } from "@/components/shell"
import { Avatar, Card, StatusBadge } from "@/components/bits"
import { fetcher } from "@/lib/swr"
import { age, fmtDate } from "@/lib/ui"
import type { Patient, Referral } from "@/lib/types"

function InfoBlock({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-foreground">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map((i) => (
            <span key={i} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              {i}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default function PatientDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data } = useSWR<{ patient: Patient }>(`/api/patients/${id}`, fetcher)
  const { data: refData } = useSWR<{ referrals: Referral[] }>("/api/referrals", fetcher)
  const patient = data?.patient
  const referrals = (refData?.referrals ?? []).filter((r) => r.patientId === id)

  if (!patient) return <Shell><p className="text-muted-foreground">Loading…</p></Shell>

  return (
    <Shell>
      <Link href="/patients" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Patients
      </Link>

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Avatar name={patient.name} size="lg" />
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{patient.name}</h1>
          <p className="text-sm text-muted-foreground">
            {age(patient.dob)}y · {patient.gender} · HC {patient.health_card_number} · {patient.family_doctor}
          </p>
        </div>
        <Link
          href={`/appointment?patient=${patient.id}`}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-emerald-600"
        >
          New Referral
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="space-y-5">
          <InfoBlock title="Conditions" items={patient.conditions} empty="None recorded" />
          <InfoBlock title="Medications" items={patient.medications} empty="None recorded" />
          <InfoBlock title="Allergies" items={patient.allergies} empty="No known allergies" />
          <div>
            <h3 className="mb-1 text-sm font-semibold text-foreground">Last Visit</h3>
            <p className="text-sm text-muted-foreground">{fmtDate(patient.last_visit)}</p>
          </div>
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-semibold text-foreground">Referral History</h3>
          {referrals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No referrals yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {referrals.map((r) => (
                <Link
                  key={r.id}
                  href={`/referrals/${r.id}`}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 hover:bg-muted/50"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{r.specialistType}</p>
                    <p className="text-xs text-muted-foreground">{fmtDate(r.created_at)}</p>
                  </div>
                  <StatusBadge status={r.status} />
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </Shell>
  )
}
