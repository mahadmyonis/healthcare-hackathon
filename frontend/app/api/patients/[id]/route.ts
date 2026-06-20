import { NextResponse } from "next/server"

const B = process.env.BACKEND_URL ?? "http://localhost:3001"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const res = await fetch(`${B}/api/patients/${id}`)
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
