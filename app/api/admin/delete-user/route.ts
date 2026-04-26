import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const { user_id, profile_id } = await req.json()
  if (!user_id && !profile_id) return NextResponse.json({ error: 'user_id veya profile_id gerekli' }, { status: 400 })

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // profile_id bul
  let pid = profile_id
  let uid = user_id
  if (!pid && uid) {
    const { data } = await admin.from('profiles').select('id').eq('user_id', uid).single()
    pid = data?.id
  }
  if (!uid && pid) {
    const { data } = await admin.from('profiles').select('user_id').eq('id', pid).single()
    uid = data?.user_id
  }

  // Tum iliskili verileri sil (service role - RLS bypass)
  if (pid) {
    await admin.from('student_badges').delete().eq('student_id', pid)
    await admin.from('student_streaks').delete().eq('student_id', pid)
    await admin.from('student_topic_performance').delete().eq('student_id', pid)
    await admin.from('student_question_attempts').delete().eq('student_id', pid)
    await admin.from('study_calendar').delete().eq('student_id', pid)
    await admin.from('student_goals').delete().eq('student_id', pid)
    await admin.from('early_alerts').delete().eq('student_id', pid)
    await admin.from('exam_results').delete().eq('student_id', pid)
    await admin.from('parent_students').delete().eq('student_id', pid)
    await admin.from('parent_students').delete().eq('parent_id', pid)
    await admin.from('homework_assignments').delete().eq('student_id', pid)
    await admin.from('calendar_notes').delete().eq('student_id', pid)
    await admin.from('calendar_notes').delete().eq('teacher_id', pid)
    await admin.from('attendance').delete().eq('student_id', pid)
    await admin.from('lessons').delete().eq('student_id', pid)
    await admin.from('lessons').delete().eq('teacher_id', pid)
    await admin.from('teachers').delete().eq('profile_id', pid)
    await admin.from('homework_assignments').delete().eq('assigned_by', pid)
    await admin.from('profiles').delete().eq('id', pid)
  }

  // auth.users sil
  if (uid) {
    const { error } = await admin.auth.admin.deleteUser(uid)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
