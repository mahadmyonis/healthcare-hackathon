import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  const res = await supabase("patients?select=*&order=name")
  const data = await res.json()
  return NextResponse.json({ patients: Array.isArray(data) ? data : [] })
}
