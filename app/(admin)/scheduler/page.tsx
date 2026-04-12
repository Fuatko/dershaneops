import { createClient } from '@/lib/supabase/server'
import SchedulerClient from './SchedulerClient'

export default async function SchedulerPage() {
  const supabase = createClient()

  const { data: lessons } = await supabase
    .from('lessons')
    .select('*')
    .gte('scheduled_at', new Date(new Date().setDate(1)).toISOString())

  const { data: teachers } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'teacher')

  const { data: students } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'student')

  return (
    <SchedulerClient
      lessons={lessons ?? []}
      teachers={teachers ?? []}
      students={students ?? []}
    />
  )
}
