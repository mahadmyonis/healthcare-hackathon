"use client"

import { useState } from "react"
import { CheckSquare, Square, Sparkles } from "lucide-react"
import type { Extraction } from "@/lib/types"

export function AiSummary({ extraction }: { extraction: Extraction }) {
  const [checked, setChecked] = useState<Record<number, boolean>>({})

  return (
    <div className="rounded-xl border-l-4 border-primary bg-card p-5 shadow-sm ring-1 ring-border">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="size-5 text-primary" />
        <h3 className="font-semibold text-foreground">AI Summary</h3>
      </div>

      <div className="space-y-4 text-sm">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Diagnosis</p>
          <p className="text-foreground">{extraction.diagnosis}</p>
        </div>

        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Key Findings</p>
          <ul className="list-disc space-y-1 pl-5 text-foreground">
            {extraction.keyFindings.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Action Items</p>
          <div className="space-y-1.5">
            {extraction.actionItems.map((a, i) => (
              <button
                key={i}
                onClick={() => setChecked((c) => ({ ...c, [i]: !c[i] }))}
                className="flex w-full items-start gap-2 text-left text-foreground"
              >
                {checked[i] ? (
                  <CheckSquare className="mt-0.5 size-4 shrink-0 text-primary" />
                ) : (
                  <Square className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                )}
                <span className={checked[i] ? "text-muted-foreground line-through" : ""}>{a}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Follow-up Timeline</p>
          <p className="text-foreground">{extraction.followUpTimeline}</p>
        </div>

        <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-blue-700">Patient Message</p>
          <p className="text-blue-900">{extraction.patientMessage}</p>
        </div>
      </div>
    </div>
  )
}
