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
    // Lessons'a bagli attendance'lari once sil
    const { data: lessons } = await admin.from('lessons').select('id').or('student_id.eq.' + pid + ',teacher_id.eq.' + pid)
    for (const lesson of lessons ?? []) {
      await admin.from('attendance').delete().eq('lesson_id', lesson.id)
    }

    // Sira ile tum iliskili verileri sil
    await admin.from('classroom_students').delete().eq('student_id', pid)
    await admin.from('attendance').delete().eq('student_id', pid)
    await admin.from('lessons').delete().or('student_id.eq.' + pid + ',teacher_id.eq.' + pid)
    await admin.from('study_plan_items').delete().in('study_plan_id',
      (await admin.from('study_plans').select('id').eq('student_id', pid)).data?.map((x: any) => x.id) ?? []
    )
    await admin.from('study_plans').delete().eq('student_id', pid)
    await admin.from('student_badges').delete().eq('student_id', pid)
    await admin.from('student_streaks').delete().eq('student_id', pid)
    await admin.from('student_topic_performance').delete().eq('student_id', pid)
    await admin.from('student_question_attempts').delete().eq('student_id', pid)
    await admin.from('student_answers').delete().in('assignment_id',
      (await admin.from('homework_assignments').select('id').eq('student_id', pid)).data?.map((x: any) => x.id) ?? []
    )
    await admin.from('homework_assignments').delete().eq('student_id', pid)
    await admin.from('homework_assignments').delete().eq('assigned_by', pid)
    await admin.from('study_calendar').delete().eq('student_id', pid)
    await admin.from('student_goals').delete().eq('student_id', pid)
    await admin.from('early_alerts').delete().eq('student_id', pid)
    await admin.from('exam_results').delete().eq('student_id', pid)
    await admin.from('parent_students').delete().or('student_id.eq.' + pid + ',parent_id.eq.' + pid)
    await admin.from('calendar_notes').delete().or('student_id.eq.' + pid + ',teacher_id.eq.' + pid)
    await admin.from('teachers').delete().eq('profile_id', pid)
    await admin.from('profiles').delete().eq('id', pid)
  }

  if (uid) {
    const { error } = await admin.auth.admin.deleteUser(uid)
    if (error && !error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
  }

  return NextResponse.json({ success: true })
}
