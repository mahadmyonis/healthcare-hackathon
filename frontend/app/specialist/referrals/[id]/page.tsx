"use client"

import { use } from "react"
import Link from "next/link"
import useSWR from "swr"
import { ArrowLeft, FileText } from "lucide-react"
import { Shell } from "@/components/shell"
import { Card, StatusBadge, UrgencyBadge } from "@/components/bits"
import { TimelineStepper } from "@/components/timeline"
import { AiSummary } from "@/components/ai-summary"
import { ReportUploader } from "@/components/report-uploader"
import { MessageThread } from "@/components/message-thread"
import { fetcher } from "@/lib/swr"
import { age, fmtDate } from "@/lib/ui"
import type { Extraction, Referral, TimelineEvent } from "@/lib/types"

export default function SpecialistReferralDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data, mutate } = useSWR<{ referral: Referral }>(`/api/referrals/${id}`, fetcher)
  const { data: tlData, mutate: mutateTl } = useSWR<{ timeline: TimelineEvent[] }>(`/api/referrals/${id}/timeline`, fetcher)

  const referral = data?.referral
  const timeline = tlData?.timeline ?? []

  if (!referral) return <Shell><p className="text-muted-foreground">Loading…</p></Shell>

  const p = referral.patients
  const onReportDone = (r: Referral, _e: Extraction) => {
    mutate({ referral: r }, false)
    mutateTl()
  }

  return (
    <Shell>
      <Link href="/specialist" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> My Patients
      </Link>

      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="text-2xl font-bold text-foreground">{p?.name}</h1>
        <UrgencyBadge urgency={referral.urgency} />
        <StatusBadge status={referral.status} />
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        DOB {p?.dob} · HC {p?.health_card_number} · Conditions: {p?.conditions.join(", ") || "none"} · Meds: {p?.medications.join(", ") || "none"}
      </p>

      <Card className="mb-6">
        <TimelineStepper status={referral.status} timeline={timeline} />
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="border-l-4 border-primary">
            <div className="mb-2 flex items-center gap-2">
              <FileText className="size-5 text-primary" />
              <h2 className="font-semibold text-foreground">AI Appointment Summary</h2>
            </div>
            <p className="mb-3 text-sm text-muted-foreground">
              {referral.referringDoctor} · {referral.urgency} · sent {fmtDate(referral.created_at)}
            </p>
            <p className="mb-3 text-sm font-medium text-foreground">Reason: {referral.reason}</p>
            <pre className="whitespace-pre-wrap rounded-lg bg-muted/50 p-4 text-sm leading-relaxed text-foreground">
              {referral.appointmentNotes || "No appointment notes provided."}
            </pre>
          </Card>

          {referral.status === "seen" && (
            <ReportUploader referralId={referral.id} label="Submit Report" onDone={onReportDone} />
          )}

          {referral.report_text && referral.extraction && <AiSummary extraction={referral.extraction} />}
        </div>

        <div className="space-y-6">
          <MessageThread self="Dr. Amir Hosseini" />
        </div>
      </div>
    </Shell>
  )
}
