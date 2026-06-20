import { NextResponse } from "next/server"

const B = process.env.BACKEND_URL ?? "http://localhost:3001"

export async function GET() {
  const res = await fetch(`${B}/api/specialists`)
  const data = await res.json()
  return NextResponse.json({ specialists: data.specialists ?? [] })
}
