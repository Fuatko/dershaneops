import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const res = await fetch(`${req.nextUrl.origin}/api/ai`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, type: 'coach' }),
  })
  const data = await res.json()
  return NextResponse.json(data)
}