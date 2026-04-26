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

  if (pid) {
    const tables = [
      { table: 'student_badges', col: 'student_id' },
      { table: 'student_streaks', col: 'student_id' },
      { table: 'student_topic_performance', col: 'student_id' },
      { table: 'student_question_attempts', col: 'student_id' },
      { table: 'study_calendar', col: 'student_id' },
      { table: 'student_goals', col: 'student_id' },
      { table: 'early_alerts', col: 'student_id' },
      { table: 'exam_results', col: 'student_id' },
      { table: 'parent_students', col: 'student_id' },
      { table: 'parent_students', col: 'parent_id' },
      { table: 'homework_assignments', col: 'student_id' },
      { table: 'homework_assignments', col: 'assigned_by' },
      { table: 'calendar_notes', col: 'student_id' },
      { table: 'calendar_notes', col: 'teacher_id' },
      { table: 'attendance', col: 'student_id' },
      { table: 'lessons', col: 'student_id' },
      { table: 'lessons', col: 'teacher_id' },
      { table: 'teachers', col: 'profile_id' },
    ]
    for (const { table, col } of tables) {
      try {
        await admin.from(table).delete().eq(col, pid)
      } catch (e) {
        // Tablo yoksa devam et
      }
    }
    await admin.from('profiles').delete().eq('id', pid)
  }

  // auth.users sil - user_id yoksa da success don
  if (uid) {
    const { error } = await admin.auth.admin.deleteUser(uid)
    if (error && !error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
  }

  return NextResponse.json({ success: true })
}
