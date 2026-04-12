import { createClient } from '@/lib/supabase/server'

export default async function ReportsPage() {
  const supabase = createClient()

  const [
    { data: lessons },
    { data: teachers },
    { data: students },
    { data: homework },
    { data: answers },
  ] = await Promise.all([
    supabase.from('lessons').select('*'),
    supabase.from('profiles').select('id, full_name').eq('role', 'teacher'),
    supabase.from('profiles').select('id, full_name').eq('role', 'student'),
    supabase.from('homework_assignments').select('*'),
    supabase.from('student_answers').select('*'),
  ])

  // Öğretmen yük hesabı
  const teacherStats = (teachers ?? []).map(t => {
    const tLessons = (lessons ?? []).filter(l => l.teacher_id === t.id)
    const completed = tLessons.filter(l => l.status === 'completed').length
    const scheduled = tLessons.filter(l => l.status === 'scheduled').length
    const cancelled = tLessons.filter(l => l.status === 'cancelled').length
    return { ...t, total: tLessons.length, completed, scheduled, cancelled }
  }).sort((a, b) => b.total - a.total)

  // Öğrenci istatistikleri
  const studentStats = (students ?? []).map(s => {
    const sLessons = (lessons ?? []).filter(l => l.student_id === s.id)
    const sHomework = (homework ?? []).filter(h => h.student_id === s.id)
    const completed = sHomework.filter(h => h.status === 'completed').length
    const pending = sHomework.filter(h => h.status === 'pending').length
    return { ...s, lessons: sLessons.length, homework: sHomework.length, completed, pending }
  })

  // Genel istatistikler
  const totalLessons = lessons?.length ?? 0
  const completedLessons = lessons?.filter(l => l.status === 'completed').length ?? 0
  const cancelledLessons = lessons?.filter(l => l.status === 'cancelled').length ?? 0
  const scheduledLessons = lessons?.filter(l => l.status === 'scheduled').length ?? 0
  const totalHomework = homework?.length ?? 0
  const completedHomework = homework?.filter(h => h.status === 'completed').length ?? 0

  return (
    <div style={{ padding: '28px', maxWidth: '1100px' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', margin: 0 }}>Raporlar</h1>
        <p style={{ fontSize: '12px', color: '#7A8FA8', margin: '3px 0 0' }}>Genel performans ve operasyon analizi</p>
      </div>

      {/* Genel Metrikler */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '20px' }}>
        {[
          { label: 'Toplam Ders', value: totalLessons, color: '#1B3A6B', bg: '#EEF3FB' },
          { label: 'Tamamlanan', value: completedLessons, color: '#2E7D52', bg: '#EAF4EE' },
          { label: 'İptal Edilen', value: cancelledLessons, color: '#C0392B', bg: '#FEF2F2' },
          { label: 'Planlanmış', value: scheduledLessons, color: '#B45309', bg: '#FDF4E7' },
        ].map(m => (
          <div key={m.label} style={{ background: m.bg, borderRadius: '10px', padding: '14px 16px' }}>
            <div style={{ fontSize: '11px', color: m.color, fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '.3px' }}>{m.label}</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>

        {/* Öğretmen Yük Raporu */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#EEF3FB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 11V8M5.5 11V5M9 11V7M12 11V3" stroke="#1B3A6B" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>Öğretmen Yük Raporu</span>
          </div>

          {teacherStats.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#7A8FA8', fontSize: '12px' }}>Henüz ders kaydı yok</div>
          ) : teacherStats.map((t, i) => {
            const pct = t.total > 0 ? Math.round((t.completed / (t.total || 1)) * 100) : 0
            const barColor = t.total > 20 ? '#C0392B' : t.total > 12 ? '#B45309' : '#2E7D52'
            return (
              <div key={t.id} style={{ marginBottom: i < teacherStats.length - 1 ? '12px' : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#1B3A6B' }}>{t.full_name}</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span style={{ fontSize: '11px', padding: '2px 7px', borderRadius: '10px', background: '#EAF4EE', color: '#2E7D52' }}>{t.completed} ✓</span>
                    <span style={{ fontSize: '11px', padding: '2px 7px', borderRadius: '10px', background: '#FDF4E7', color: '#B45309' }}>{t.scheduled} 📅</span>
                    {t.cancelled > 0 && <span style={{ fontSize: '11px', padding: '2px 7px', borderRadius: '10px', background: '#FEF2F2', color: '#C0392B' }}>{t.cancelled} ✗</span>}
                  </div>
                </div>
                <div style={{ height: '7px', background: '#F0F4F9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: barColor, borderRadius: '4px', transition: 'width .3s' }} />
                </div>
                <div style={{ fontSize: '10px', color: '#7A8FA8', marginTop: '2px' }}>Toplam {t.total} ders — %{pct} tamamlama</div>
              </div>
            )
          })}
        </div>

        {/* Ödev Raporu */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#EAF4EE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="2" y="1" width="10" height="12" rx="1.5" stroke="#2E7D52" strokeWidth="1.2" fill="none"/>
                <path d="M5 5h4M5 7.5h4M5 10h2" stroke="#2E7D52" strokeWidth="1" strokeLinecap="round"/>
              </svg>
            </div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>Ödev Durumu</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
            {[
              { label: 'Toplam Ödev', value: totalHomework, color: '#1B3A6B', bg: '#EEF3FB' },
              { label: 'Tamamlanan', value: completedHomework, color: '#2E7D52', bg: '#EAF4EE' },
              { label: 'Bekleyen', value: totalHomework - completedHomework, color: '#B45309', bg: '#FDF4E7' },
              { label: 'Tamamlama %', value: totalHomework > 0 ? Math.round(completedHomework / totalHomework * 100) + '%' : '0%', color: '#6B4FC8', bg: '#F0ECFB' },
            ].map(m => (
              <div key={m.label} style={{ background: m.bg, borderRadius: '8px', padding: '10px 12px' }}>
                <div style={{ fontSize: '10px', color: m.color, fontWeight: 600, marginBottom: '3px' }}>{m.label}</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: m.color }}>{m.value}</div>
              </div>
            ))}
          </div>

          {studentStats.length > 0 && (
            <>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#1B3A6B', marginBottom: '10px' }}>Öğrenci Bazlı</div>
              {studentStats.slice(0, 5).map((s, i) => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 0', borderBottom: i < 4 ? '1px solid #F0F4F9' : 'none' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#E2EAF8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: '#1B3A6B', flexShrink: 0 }}>
                    {s.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                  </div>
                  <span style={{ fontSize: '12px', color: '#374151', flex: 1 }}>{s.full_name}</span>
                  <span style={{ fontSize: '11px', padding: '2px 7px', borderRadius: '10px', background: '#EAF4EE', color: '#2E7D52' }}>{s.completed} ✓</span>
                  <span style={{ fontSize: '11px', padding: '2px 7px', borderRadius: '10px', background: '#FDF4E7', color: '#B45309' }}>{s.pending} ⏳</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Ders Dağılımı */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#FDF4E7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="5.5" stroke="#B45309" strokeWidth="1.2" fill="none"/>
              <path d="M7 7L7 3M7 7L10.5 9" stroke="#B45309" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>Ders Durum Dağılımı</span>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {totalLessons > 0 ? (
            <>
              <div style={{ flex: 1, height: '24px', borderRadius: '6px', overflow: 'hidden', display: 'flex' }}>
                {[
                  { value: completedLessons, color: '#2E7D52', label: 'Tamamlanan' },
                  { value: scheduledLessons, color: '#1B3A6B', label: 'Planlanmış' },
                  { value: cancelledLessons, color: '#C0392B', label: 'İptal' },
                ].map(({ value, color }) => (
                  value > 0 ? <div key={color} style={{ width: `${Math.round(value / totalLessons * 100)}%`, background: color, transition: 'width .3s' }} /> : null
                ))}
              </div>
              <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
                {[
                  { label: 'Tamamlanan', value: completedLessons, color: '#2E7D52', bg: '#EAF4EE' },
                  { label: 'Planlanmış', value: scheduledLessons, color: '#1B3A6B', bg: '#EEF3FB' },
                  { label: 'İptal', value: cancelledLessons, color: '#C0392B', bg: '#FEF2F2' },
                ].map(m => (
                  <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: m.color }} />
                    <span style={{ fontSize: '11.5px', color: '#4A6080' }}>{m.label}: <strong>{m.value}</strong></span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', width: '100%', padding: '16px', color: '#7A8FA8', fontSize: '12px' }}>Henüz ders kaydı yok</div>
          )}
        </div>
      </div>
    </div>
  )
}
