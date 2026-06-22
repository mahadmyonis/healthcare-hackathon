import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(req: Request) {
  const status = new URL(req.url).searchParams.get("status")
  const filter = status ? `&status=eq.${status}` : ""
  const res = await supabase(
    `referrals?select=*,patients(*)&order=sent_at.desc${filter}`
  )
  const data = await res.json()
  const referrals = (Array.isArray(data) ? data : []).map(normalize)
  return NextResponse.json({ referrals })
}

export async function POST(req: Request) {
  const body = await req.json()
  const res = await supabase("referrals", {
    method: "POST",
    body: JSON.stringify({
      patient_id: body.patientId,
      referring_doctor: body.referringDoctor ?? "Dr. Sarah Chen",
      specialist_type: body.specialistType,
      reason: body.reason,
      urgency: body.urgency ?? "routine",
      appointment_notes: body.appointmentNotes ?? "",
      status: "pending",
    }),
  })
  const data = await res.json()
  const referral = Array.isArray(data) ? data[0] : data
  return NextResponse.json({ referral: normalize(referral) }, { status: 201 })
}

function normalize(r: Record<string, unknown>) {
  if (!r) return r
  return {
    ...r,
    patientId: r.patient_id,
    referringDoctor: r.referring_doctor,
    specialistType: r.specialist_type,
    appointmentNotes: r.appointment_notes ?? "",
    created_at: r.sent_at ?? r.created_at,
    patients: r.patients,
  }
}
