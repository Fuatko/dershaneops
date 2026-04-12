import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function HomeworkPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '14px', color: '#C0392B', marginBottom: '12px' }}>
          Profil bulunamadı. Lütfen önce profil oluşturun.
        </div>
        <a href="/register" style={{ color: '#1B3A6B', fontWeight: 600 }}>Kayıt sayfasına git</a>
      </div>
    )
  }

  const { data: assignments } = await supabase
    .from('homework_assignments')
    .select(`
      *,
      tests (
        id, name, question_count,
        chapters (
          id, name,
          books ( id, name, subject, color )
        )
      )
    `)
    .eq('student_id', profile.id)
    .order('created_at', { ascending: false })

  const grouped: Record<string, any[]> = {}
  for (const a of assignments ?? []) {
    const bookName = a.tests?.chapters?.books?.name ?? 'Diğer'
    if (!grouped[bookName]) grouped[bookName] = []
    grouped[bookName].push(a)
  }

  const pending = assignments?.filter(a => a.status !== 'completed').length ?? 0
  const completed = assignments?.filter(a => a.status === 'completed').length ?? 0

  return (
    <div style={{ padding: '28px', maxWidth: '900px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', margin: 0 }}>Ödevler</h1>
          <p style={{ fontSize: '12px', color: '#7A8FA8', margin: '3px 0 0' }}>Merhaba, {profile.full_name}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href="/swot" style={{ padding: '8px 14px', borderRadius: '8px', background: '#F0ECFB', color: '#6B4FC8', fontSize: '12.5px', fontWeight: 600, textDecoration: 'none', border: '1px solid #C4B5FD' }}>
            SWOT Analizim →
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '20px' }}>
        {[
          { label: 'Bekleyen Ödev', value: pending, color: '#B45309', bg: '#FDF4E7' },
          { label: 'Tamamlanan', value: completed, color: '#2E7D52', bg: '#EAF4EE' },
          { label: 'Toplam', value: (assignments?.length ?? 0), color: '#1B3A6B', bg: '#EEF3FB' },
        ].map(m => (
          <div key={m.label} style={{ background: m.bg, borderRadius: '10px', padding: '14px 16px' }}>
            <div style={{ fontSize: '11px', color: m.color, fontWeight: 600, marginBottom: '4px' }}>{m.label}</div>
            <div style={{ fontSize: '26px', fontWeight: 700, color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div style={{ background: '#EAF4EE', border: '1px solid #A7D9B8', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: '#2E7D52', fontWeight: 600, marginBottom: '8px' }}>
            Henüz ödev atanmamış
          </div>
          <div style={{ fontSize: '12px', color: '#7A8FA8' }}>
            Admin panelinden ödev atandığında burada görünecek.
          </div>
        </div>
      ) : Object.entries(grouped).map(([bookName, items]) => {
        const book = items[0]?.tests?.chapters?.books
        const color = book?.color ?? '#1B3A6B'
        return (
          <div key={bookName} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', marginBottom: '14px', overflow: 'hidden' }}>
            <div style={{ height: '4px', background: color }} />
            <div style={{ padding: '14px 18px 6px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #F0F4F9' }}>
              <div style={{ width: '32px', height: '40px', borderRadius: '4px', background: color + '18', border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="1.5" y="0.5" width="9" height="13" rx="1.5" stroke={color} strokeWidth="1.2" fill="none"/>
                  <path d="M4 4h5M4 7h5M4 10h3" stroke={color} strokeWidth="1" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#1B3A6B' }}>{bookName}</div>
                <div style={{ fontSize: '11.5px', color: '#7A8FA8' }}>{book?.subject} — {items.length} test</div>
              </div>
            </div>
            <div style={{ padding: '8px 10px' }}>
              {items.map(a => {
                const isDone = a.status === 'completed'
                const isLate = !isDone && a.deadline && new Date(a.deadline) < new Date()
                return (
                  <Link key={a.id} href={`/homework/${a.id}`} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px', borderRadius: '8px', marginBottom: '4px',
                    textDecoration: 'none',
                    background: isDone ? '#F8FFF8' : isLate ? '#FFF5F5' : 'transparent',
                    border: `1px solid ${isDone ? '#C6E8D0' : isLate ? '#FECACA' : 'transparent'}`,
                  }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, background: isDone ? '#EAF4EE' : '#EEF3FB', color: isDone ? '#2E7D52' : '#1B3A6B', border: `1.5px solid ${isDone ? '#A7D9B8' : '#BFDBFE'}` }}>
                      {isDone ? '✓' : a.tests?.name?.replace('Test ', 'T') ?? '?'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: isDone ? '#4A6080' : '#1B3A6B', textDecoration: isDone ? 'line-through' : 'none' }}>
                        {a.tests?.name} — {a.tests?.chapters?.name}
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#7A8FA8', marginTop: '2px' }}>
                        {a.tests?.question_count} soru
                        {a.deadline && ` • Son: ${new Date(a.deadline).toLocaleDateString('tr-TR')}`}
                      </div>
                    </div>
                    {isDone ? (
                      <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 9px', borderRadius: '20px', background: '#EAF4EE', color: '#2E7D52' }}>Tamamlandı</span>
                    ) : isLate ? (
                      <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 9px', borderRadius: '20px', background: '#FEF2F2', color: '#C0392B' }}>Gecikti!</span>
                    ) : (
                      <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 9px', borderRadius: '20px', background: '#FDF4E7', color: '#B45309' }}>Bekliyor</span>
                    )}
                    <span style={{ fontSize: '12px', color: '#7A8FA8' }}>→</span>
                  </Link>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
