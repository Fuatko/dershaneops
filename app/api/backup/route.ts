import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  // Basit güvenlik kontrolü
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.BACKUP_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient()
  const tables = [
    'tenants', 'profiles', 'books', 'chapters', 'tests',
    'answer_keys', 'lessons', 'homework_assignments',
    'student_answers', 'notifications'
  ]

  const backup: any = {
    exported_at: new Date().toISOString(),
    version: '1.0',
    tables: {}
  }

  for (const table of tables) {
    const { data } = await supabase.from(table).select('*')
    backup.tables[table] = data ?? []
  }

  const totalRows = Object.values(backup.tables)
    .reduce((sum: number, rows: any) => sum + rows.length, 0)

  return NextResponse.json({
    ok: true,
    exported_at: backup.exported_at,
    total_rows: totalRows,
    backup
  })
}
