import { NextResponse } from "next/server"

const B = process.env.BACKEND_URL ?? "http://localhost:3001"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { reportText } = await req.json()
  const res = await fetch(`${B}/api/referrals/${id}/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reportText }),
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
