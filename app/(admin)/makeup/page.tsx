import { createClient } from '@/lib/supabase/server'
import MakeupClient from './MakeupClient'

export default async function MakeupPage() {
  const supabase = createClient()

  const { data: lessons } = await supabase
    .from('lessons')
    .select('*')
    .eq('status', 'cancelled')
    .order('scheduled_at', { ascending: false })

  const { data: teachers } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'teacher')

  const { data: students } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'student')

  return (
    <MakeupClient
      cancelledLessons={lessons ?? []}
      teachers={teachers ?? []}
      students={students ?? []}
    />
  )
}
