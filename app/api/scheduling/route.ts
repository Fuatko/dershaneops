import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { teacher_id, student_id, subject, scheduled_at, duration_min } = await req.json()
    if (!teacher_id || !student_id || !subject || !scheduled_at) {
      return NextResponse.json({ ok: false, error: 'Tum alanlar zorunludur' })
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: false, error: 'Yetkisiz' })

    const { data: prof } = await supabase.from('profiles').select('tenant_id').eq('user_id', user.id).single()
    const tenantId = prof?.tenant_id

    const { error } = await supabase.from('lessons').insert({
      tenant_id: tenantId,
      teacher_id,
      student_id,
      subject,
      scheduled_at,
      duration_min: duration_min ?? 60,
      status: 'scheduled',
    })

    if (error) return NextResponse.json({ ok: false, error: error.message })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message })
  }
}
