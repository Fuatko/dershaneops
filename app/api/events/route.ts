import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabaseServer = createClient()
  const { data: { user } } = await supabaseServer.auth.getUser()
  const { data: prof } = await supabaseServer.from('profiles').select('tenant_id').eq('user_id', user?.id ?? '').single()
  const tenantId = prof?.tenant_id ?? null

  try {
    const { student_id, event_type, event_data } = await req.json()
    const supabase = createClient()

    // Event'i logla
    await supabase.from('student_events').insert({
      student_id,
      event_type,
      event_data,
    })

    // Event tipine göre aksiyon
    if (event_type === 'risk_detected') {
      await supabase.from('notifications').insert({
        tenant_id: tenantId,
        target_type: 'admin',
        target_id: student_id,
        channel: 'in_app',
        title: 'Risk Uyarısı: ' + event_data.student_name,
        content: event_data.message,
        status: 'pending',
      })
    }

    if (event_type === 'high_performance') {
      await supabase.from('notifications').insert({
        tenant_id: tenantId,
        target_type: 'admin',
        target_id: student_id,
        channel: 'in_app',
        title: '🌟 Yüksek Performans: ' + event_data.student_name,
        content: event_data.message,
        status: 'pending',
      })
    }

    if (event_type === 'task_completed') {
      await supabase.from('notifications').insert({
        tenant_id: tenantId,
        target_type: 'admin',
        target_id: student_id,
        channel: 'in_app',
        title: '✅ Görev Tamamlandı: ' + event_data.student_name,
        content: event_data.message,
        status: 'pending',
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message })
  }
}

export async function GET() {
  try {
    const supabase = createClient()
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(50)
    return NextResponse.json({ ok: true, notifications: data ?? [] })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message })
  }
}