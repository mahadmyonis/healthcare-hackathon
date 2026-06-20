import { NextResponse } from "next/server"

const B = process.env.BACKEND_URL ?? "http://localhost:3001"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const res = await fetch(`${B}/api/referrals/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status: body.status,
      triggeredBy: body.triggeredBy ?? "System",
      note: body.note ?? "",
    }),
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
