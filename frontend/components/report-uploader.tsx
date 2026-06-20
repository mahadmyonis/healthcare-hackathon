"use client"

import { useState } from "react"
import { Loader2, Sparkles } from "lucide-react"
import { useToast } from "@/components/toast"
import { sendJSON } from "@/lib/ui"
import type { Extraction, Referral } from "@/lib/types"

export const SAMPLE_NOTE = `CARDIOLOGY CONSULTATION NOTE
Patient: Margaret Chen, DOB: 1952-03-14
Referred by: Dr. Sarah Chen

FINDINGS:
ECG shows left ventricular hypertrophy. Echo reveals mild aortic stenosis valve area 1.4cm2, EF 55%. Stress test positive at 7 METs with ST depression in lateral leads.

IMPRESSION:
Mild aortic stenosis with positive stress test. CAD cannot be excluded.

RECOMMENDATIONS:
1. Start metoprolol succinate 25mg daily, titrate to 50mg in 4 weeks
2. Repeat echocardiogram in 6 months
3. Refer to cardiac surgery within 60 days
4. Sodium restriction less than 2g per day
5. Order fasting lipid panel and HbA1c
6. Follow up cardiology in 3 months`

export function ReportUploader({
  referralId,
  label,
  onDone,
}: {
  referralId: string
  label: string
  onDone: (r: Referral, e: Extraction) => void
}) {
  const toast = useToast()
  const [text, setText] = useState(SAMPLE_NOTE)
  const [loading, setLoading] = useState(false)

  const process = async () => {
    setLoading(true)
    try {
      const { referral, extraction } = await sendJSON<{ referral: Referral; extraction: Extraction }>(
        `/api/referrals/${referralId}/report`,
        "POST",
        { reportText: text },
      )
      toast(extraction.isRejected ? "Report processed — referral rejected" : "Report processed by AI")
      onDone(referral, extraction)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="mb-3 text-sm font-semibold text-foreground">{label}</h3>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-xs leading-relaxed focus:border-primary focus:outline-none"
      />
      <button
        onClick={process}
        disabled={loading}
        className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-emerald-600 disabled:opacity-60"
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
        {loading ? "AI is reading the report…" : "Process with AI"}
      </button>
    </div>
  )
}
