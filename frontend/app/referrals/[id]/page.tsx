"use client"

import { use, useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { AlertTriangle, ArrowLeft, ChevronDown, FileText, XCircle } from "lucide-react"
import { Shell } from "@/components/shell"
import { Card, StatusBadge, UrgencyBadge } from "@/components/bits"
import { TimelineStepper } from "@/components/timeline"
import { AiSummary } from "@/components/ai-summary"
import { ReportUploader } from "@/components/report-uploader"
import { MessageThread } from "@/components/message-thread"
import { fetcher } from "@/lib/swr"
import { age } from "@/lib/ui"
import type { Extraction, Referral, TimelineEvent } from "@/lib/types"

export default function ReferralDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data, mutate } = useSWR<{ referral: Referral }>(`/api/referrals/${id}`, fetcher)
  const { data: tlData, mutate: mutateTl } = useSWR<{ timeline: TimelineEvent[] }>(`/api/referrals/${id}/timeline`, fetcher)
  const [rawOpen, setRawOpen] = useState(false)

  const referral = data?.referral
  const timeline = tlData?.timeline ?? []

  if (!referral) return <Shell><p className="text-muted-foreground">Loading…</p></Shell>

  const onReportDone = (r: Referral, _e: Extraction) => {
    mutate({ referral: r }, false)
    mutateTl()
  }

  return (
    <Shell>
      <Link href="/" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Dashboard
      </Link>

      <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="text-2xl font-bold text-foreground">{referral.patients?.name}</h1>
        <span className="text-muted-foreground">
          {referral.patients ? `${age(referral.patients.dob)}y` : ""} · {referral.specialistType}
        </span>
        <UrgencyBadge urgency={referral.urgency} />
        <StatusBadge status={referral.status} />
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        Referred by {referral.referringDoctor} — {referral.reason}
      </p>

      {/* timeline */}
      <Card className="mb-6">
        <TimelineStepper status={referral.status} timeline={timeline} />
      </Card>

      {/* banners */}
      {referral.status === "rejected" && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <XCircle className="mt-0.5 size-5 shrink-0 text-red-600" />
          <div className="flex-1">
            <p className="font-medium text-red-800">Referral Rejected</p>
            <p className="text-sm text-red-700">{referral.rejection_reason || referral.extraction?.rejectionReason}</p>
          </div>
          <Link href={`/appointment?patient=${referral.patientId}`} className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700">
            Revise & Resubmit
          </Link>
        </div>
      )}
      {referral.status === "needs_attention" && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-medium text-amber-800">Needs Attention</p>
            <p className="text-sm text-amber-700">
              {timeline.find((t) => t.status === "needs_attention")?.note || "The specialist has requested more information."}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* report section */}
          {referral.report_text ? (
            <>
              <div className="rounded-xl border border-border bg-card">
                <button
                  onClick={() => setRawOpen((o) => !o)}
                  className="flex w-full items-center justify-between px-5 py-3 text-sm font-medium text-foreground"
                >
                  <span className="flex items-center gap-2"><FileText className="size-4 text-muted-foreground" /> Raw Report</span>
                  <ChevronDown className={`size-4 transition-transform ${rawOpen ? "rotate-180" : ""}`} />
                </button>
                {rawOpen && (
                  <pre className="whitespace-pre-wrap border-t border-border px-5 py-4 font-mono text-xs leading-relaxed text-muted-foreground">
                    {referral.report_text}
                  </pre>
                )}
              </div>
              {referral.extraction && <AiSummary extraction={referral.extraction} />}
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              Awaiting specialist report
            </div>
          )}

          {/* uploader always visible for demo */}
          <ReportUploader referralId={referral.id} label="Upload Report" onDone={onReportDone} />
        </div>

        <div className="space-y-6">
          <MessageThread self="Dr. Sarah Chen" />
        </div>
      </div>
    </Shell>
  )
}
