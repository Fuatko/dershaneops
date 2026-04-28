import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const TWILIO_SID   = process.env.TWILIO_ACCOUNT_SID!
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN!
const FROM_NUMBER  = process.env.TWILIO_WHATSAPP_FROM!

async function sendWhatsApp(to: string, body: string) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`
  const auth = Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64')
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ From: FROM_NUMBER, To: `whatsapp:${to}`, Body: body }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? 'Twilio error')
  return data.sid
}

export async function POST(req: NextRequest) {
  try {
    const { tenant_id, candidate_name, phone, grade_level, target_exam, source } = await req.json()

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Tenant'in admin profillerini bul (telefonu olanlar)
    const { data: admins } = await admin
      .from('profiles')
      .select('full_name, phone_number')
      .eq('tenant_id', tenant_id)
      .eq('role', 'admin')
      .not('phone_number', 'is', null)

    if (!admins?.length) return NextResponse.json({ ok: true, message: 'Admin telefonu yok' })

    const message = `🎯 *Yeni Aday Basvurusu!*

Ad: *${candidate_name}*
Telefon: ${phone || 'Belirtilmedi'}
Sinif: ${grade_level ? grade_level + '. Sinif' : 'Belirtilmedi'}
Hedef: ${target_exam || 'Belirtilmedi'}
Kaynak: ${source || 'web'}

👉 Adayi incelemek icin:
dershaneops.vercel.app/candidates

_DershaneOPS Yonetim Sistemi_`

    for (const a of admins) {
      try {
        await sendWhatsApp(a.phone_number, message)
      } catch (e) {
        console.error('WhatsApp hatasi:', e)
      }
    }

    return NextResponse.json({ ok: true, sent: admins.length })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
