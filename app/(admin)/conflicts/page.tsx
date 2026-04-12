import { createClient } from '@/lib/supabase/server'
import ConflictsClient from './ConflictsClient'

export default async function ConflictsPage() {
  const supabase = createClient()

  const { data: lessons } = await supabase
    .from('lessons')
    .select('*')
    .eq('status', 'scheduled')
    .order('scheduled_at')

  const { data: teachers } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'teacher')

  const { data: students } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'student')

  // Çakışma tespiti
  const conflicts: any[] = []

  for (let i = 0; i < (lessons?.length ?? 0); i++) {
    for (let j = i + 1; j < (lessons?.length ?? 0); j++) {
      const a = lessons![i]
      const b = lessons![j]

      const aStart = new Date(a.scheduled_at).getTime()
      const aEnd = aStart + a.duration_min * 60000
      const bStart = new Date(b.scheduled_at).getTime()
      const bEnd = bStart + b.duration_min * 60000

      const overlap = aStart < bEnd && aEnd > bStart

      if (!overlap) continue

      if (a.teacher_id === b.teacher_id) {
        const teacher = teachers?.find(t => t.id === a.teacher_id)
        conflicts.push({
          id: `${a.id}-${b.id}`,
          type: 'teacher',
          severity: 'high',
          lesson_a: a,
          lesson_b: b,
          person: teacher?.full_name ?? 'Öğretmen',
          description: `${teacher?.full_name} aynı saatte iki farklı derse atanmış`,
        })
      }

      if (a.student_id === b.student_id) {
        const student = students?.find(s => s.id === a.student_id)
        conflicts.push({
          id: `${a.id}-${b.id}-s`,
          type: 'student',
          severity: 'high',
          lesson_a: a,
          lesson_b: b,
          person: student?.full_name ?? 'Öğrenci',
          description: `${student?.full_name} aynı saatte iki farklı derse kayıtlı`,
        })
      }
    }
  }

  return (
    <ConflictsClient
      conflicts={conflicts}
      lessons={lessons ?? []}
      teachers={teachers ?? []}
      students={students ?? []}
    />
  )
}
