import { NextResponse } from "next/server"

const P = process.env.PYTHON_URL ?? "http://localhost:8000"

export async function POST(req: Request) {
  const { transcript, patientHistory } = await req.json()
  const res = await fetch(`${P}/transcribe/text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript, patient_history: patientHistory ?? "" }),
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
