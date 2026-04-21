import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const TWILIO_SID   = process.env.TWILIO_ACCOUNT_SID!
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN!
const FROM_NUMBER  = process.env.TWILIO_WHATSAPP_FROM!

async function sendWhatsApp(to: string, body: string) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`
  const auth = Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64')

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      From: FROM_NUMBER,
      To: `whatsapp:${to}`,
      Body: body,
    }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? 'Twilio error')
  return data.sid as string
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const body = await req.json()

  const { type, recipient_ids, custom_message, filters } = body

  // Alıcıları bul
  let query = supabase
    .from('profiles')
    .select('id, full_name, phone_number, whatsapp_enabled')
    .eq('whatsapp_enabled', true)
    .not('phone_number', 'is', null)

  if (recipient_ids?.length) {
    query = query.in('id', recipient_ids)
  } else if (filters?.role) {
    query = query.eq('role', filters.role)
  }

  const { data: recipients, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  if (!recipients?.length) return NextResponse.json({ error: 'Alıcı bulunamadı' }, { status: 400 })

  const results = []

  for (const r of recipients) {
    let messageBody = custom_message

    // Mesaj tipine göre şablon
    if (!custom_message) {
      if (type === 'risk_alert') {
        const { data: riskData } = await supabase.rpc('calculate_risk_score', { p_student_id: r.id })
        const score = Math.round(riskData ?? 0)
        if (score < 45) continue // Sadece yüksek risk
        messageBody = `🚨 *DershaneOPS Risk Uyarısı*\n\nSayın ${r.full_name},\n\n${r.full_name} için akademik risk skoru: *${score}/100*\n\nLütfen öğrencinin çalışma durumunu gözden geçiriniz.\n\n_DershaneOPS Yönetim Sistemi_`
      } else if (type === 'homework_reminder') {
        messageBody = `📚 *DershaneOPS Ödev Hatırlatma*\n\nSayın ${r.full_name},\n\nTamamlanmamış ödevler bulunmaktadır. Lütfen öğrencinin ödevlerini kontrol ediniz.\n\n_DershaneOPS Yönetim Sistemi_`
      } else if (type === 'weekly_report') {
        messageBody = `📊 *DershaneOPS Haftalık Rapor*\n\nSayın ${r.full_name},\n\nHaftalık akademik rapor hazır. Sisteme giriş yaparak detayları inceleyebilirsiniz.\n\n🌐 dershaneops.vercel.app\n\n_DershaneOPS Yönetim Sistemi_`
      }
    }

    if (!messageBody) continue

    // Veritabanına kaydet
    const { data: notifRecord } = await supabase
      .from('whatsapp_notifications')
      .insert({
        recipient_id: r.id,
        phone_number: r.phone_number,
        message_type: type ?? 'manual',
        message_body: messageBody,
        status: 'pending',
      })
      .select()
      .single()

    // Twilio'ya gönder
    try {
      const sid = await sendWhatsApp(r.phone_number!, messageBody)
      await supabase
        .from('whatsapp_notifications')
        .update({ status: 'sent', twilio_sid: sid, sent_at: new Date().toISOString() })
        .eq('id', notifRecord?.id)
      results.push({ id: r.id, name: r.full_name, status: 'sent' })
    } catch (err: any) {
      await supabase
        .from('whatsapp_notifications')
        .update({ status: 'failed', error_message: err.message })
        .eq('id', notifRecord?.id)
      results.push({ id: r.id, name: r.full_name, status: 'failed', error: err.message })
    }
  }

  const sent   = results.filter(r => r.status === 'sent').length
  const failed = results.filter(r => r.status === 'failed').length

  return NextResponse.json({ results, sent, failed })
}