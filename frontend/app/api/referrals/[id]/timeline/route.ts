import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const res = await supabase(`timeline_events?referral_id=eq.${id}&select=*&order=created_at.asc`)
  const data = await res.json()
  return NextResponse.json({ timeline: Array.isArray(data) ? data : [] })
}
