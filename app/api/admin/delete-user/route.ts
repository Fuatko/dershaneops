import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const { user_id } = await req.json()
  if (!user_id) return NextResponse.json({ error: 'user_id gerekli' }, { status: 400 })

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Profile ID bul
  const { data: profile } = await adminClient.from('profiles').select('id').eq('user_id', user_id).single()
  const profileId = profile?.id

  if (profileId) {
    // Iliskili tum verileri sil
    await adminClient.from('student_badges').delete().eq('student_id', profileId)
    await adminClient.from('student_streaks').delete().eq('student_id', profileId)
    await adminClient.from('student_topic_performance').delete().eq('student_id', profileId)
    await adminClient.from('student_question_attempts').delete().eq('student_id', profileId)
    await adminClient.from('study_calendar').delete().eq('student_id', profileId)
    await adminClient.from('student_goals').delete().eq('student_id', profileId)
    await adminClient.from('early_alerts').delete().eq('student_id', profileId)
    await adminClient.from('exam_results').delete().eq('student_id', profileId)
    await adminClient.from('parent_students').delete().eq('student_id', profileId)
    await adminClient.from('parent_students').delete().eq('parent_id', profileId)
    await adminClient.from('homework_assignments').delete().eq('student_id', profileId)
    await adminClient.from('calendar_notes').delete().eq('student_id', profileId)
    await adminClient.from('attendance').delete().eq('student_id', profileId)
  }

  // Profiles sil
  await adminClient.from('profiles').delete().eq('user_id', user_id)

  // Auth user sil
  const { error } = await adminClient.auth.admin.deleteUser(user_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ success: true })
}
