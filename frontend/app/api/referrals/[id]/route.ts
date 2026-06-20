import { NextResponse } from "next/server"

const B = process.env.BACKEND_URL ?? "http://localhost:3001"

function normalize(r: Record<string, unknown>) {
  if (!r) return r
  return {
    ...r,
    patientId: r.patient_id ?? r.patientId,
    referringDoctor: r.referring_doctor ?? r.referringDoctor,
    specialistType: r.specialist_type ?? r.specialistType,
    appointmentNotes: r.appointment_notes ?? r.appointmentNotes ?? "",
    created_at: r.sent_at ?? r.created_at,
    patients: r.patients,
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const res = await fetch(`${B}/api/referrals/${id}`)
  const data = await res.json()
  return NextResponse.json({ referral: normalize(data.referral) }, { status: res.status })
}
