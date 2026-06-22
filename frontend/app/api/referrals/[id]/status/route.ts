import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { status, triggeredBy, note } = await req.json()

  const res = await supabase(`referrals?id=eq.${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status, updated_at: new Date().toISOString() }),
  })

  // Also log timeline event
  await supabase("timeline_events", {
    method: "POST",
    body: JSON.stringify({
      referral_id: id,
      status,
      triggered_by: triggeredBy ?? "System",
      note: note ?? "",
    }),
  })

  const data = await res.json()
  return NextResponse.json({ referral: Array.isArray(data) ? data[0] : data })
}
