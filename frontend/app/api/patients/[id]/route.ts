import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const res = await supabase(`patients?id=eq.${id}&select=*`)
  const data = await res.json()
  const patient = Array.isArray(data) ? data[0] : null
  if (!patient) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ patient })
}
