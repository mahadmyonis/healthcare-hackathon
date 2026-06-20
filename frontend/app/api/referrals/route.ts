import { NextResponse } from "next/server"

const B = process.env.BACKEND_URL ?? "http://localhost:3001"

export async function GET(req: Request) {
  const status = new URL(req.url).searchParams.get("status")
  const url = status ? `${B}/api/referrals?status=${status}` : `${B}/api/referrals`
  const res = await fetch(url)
  const data = await res.json()
  // Normalize field names: backend uses snake_case, frontend expects camelCase for some fields
  const referrals = (data.referrals ?? []).map(normalize)
  return NextResponse.json({ referrals })
}

export async function POST(req: Request) {
  const body = await req.json()
  const res = await fetch(`${B}/api/referrals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      patientId: body.patientId,
      referringDoctor: body.referringDoctor ?? "Dr. Sarah Chen",
      specialistType: body.specialistType,
      reason: body.reason,
      urgency: body.urgency ?? "routine",
      appointmentNotes: body.appointmentNotes ?? "",
    }),
  })
  const data = await res.json()
  return NextResponse.json({ referral: normalize(data.referral) }, { status: res.status })
}

function normalize(r: Record<string, unknown>) {
  if (!r) return r
  return {
    ...r,
    // map patient_id → patientId so frontend components work
    patientId: r.patient_id ?? r.patientId,
    // map referring_doctor → referringDoctor
    referringDoctor: r.referring_doctor ?? r.referringDoctor,
    specialistType: r.specialist_type ?? r.specialistType,
    appointmentNotes: r.appointment_notes ?? r.appointmentNotes ?? "",
    created_at: r.sent_at ?? r.created_at,
    // Keep patients join if present
    patients: r.patients,
  }
}
