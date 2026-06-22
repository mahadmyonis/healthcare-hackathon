import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  const res = await supabase("specialists?select=*&order=name")
  const data = await res.json()
  return NextResponse.json({ specialists: Array.isArray(data) ? data : [] })
}
