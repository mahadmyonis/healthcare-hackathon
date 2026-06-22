import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const res = await supabase(`referrals?id=eq.${id}&select=*,patients(*)`)
  const data = await res.json()
  const r = Array.isArray(data) ? data[0] : null
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({
    referral: {
      ...r,
      patientId: r.patient_id,
      referringDoctor: r.referring_doctor,
      specialistType: r.specialist_type,
      appointmentNotes: r.appointment_notes ?? "",
      created_at: r.sent_at ?? r.created_at,
    },
  })
}
