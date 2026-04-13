'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const MONTHS = ['Ocak','Subat','Mart','Nisan','Mayis','Haziran','Temmuz','Agustos','Eylul','Ekim','Kasim','Aralik']

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + String(d.getHours()).padStart(2,'0') + ':00'
}

export default function TeacherPage() {
  const [profile, setProfile] = useState<any>(null)
  const [lessons, setLessons] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [homework, setHomework] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }

    const { data: p } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()
    if (!p) { setLoading(false); return }
    setProfile(p)

    const today = new Date()
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay() + 1)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)

    const { data: l } = await supabase
      .from('lessons')
      .select('*, profiles!lessons_student_id_fkey(full_name)')
      .eq('teacher_id', p.id)
      .order('scheduled_at')

    const studentIds = [...new Set((l ?? []).map((x: any) => x.student_id))]
    let studentsData: any[] = []
    if (studentIds.length > 0) {
      const { data: s } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', studentIds)
      studentsData = s ?? []
    }

    const { data: hw } = await supabase
      .from('homework_assignments')
      .select('*, profiles!homework_assignments_student_id_fkey(full_name), tests(name, chapters(name, books(name)))')
      .in('student_id', studentIds.length > 0 ? studentIds : ['none'])
      .order('created_at', { ascending: false })

    setLessons(l ?? [])
    setStudents(studentsData)
    setHomework(hw ?? [])
    setLoading(false)
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#7A8FA8' }}>Yukleniyor...</div>

  const today = new Date()
  const upcomingLessons = lessons.filter(l => new Date(l.scheduled_at) >= today && l.status === 'scheduled').slice(0, 5)
  const completedLessons = lessons.filter(l => l.status === 'completed').length
  const cancelledLessons = lessons.filter(l => l.status === 'cancelled').length
  const pendingHw = homework.filter(h => h.status === 'pending').length
  const completedHw = homework.filter(h => h.status === 'completed').length

  const TABS = [
    { id: 'dashboard', label: 'Genel Bakis' },
    { id: 'lessons', label: 'Derslerim' },
    { id: 'students', label: 'Ogrencilerim' },
    { id: 'homework', label: 'Odevler' },
  ]

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#F0F4F9' }}>

      {/* Sidebar */}
      <aside style={{ width: '220px', background: '#fff', borderRight: '1px solid #D5DFF0', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '18px 16px', borderBottom: '1px solid #D5DFF0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '7px', background: '#1B3A6B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="1" width="5" height="5" rx="1" fill="white" opacity=".9"/>
                <rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity=".5"/>
                <rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity=".5"/>
                <rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity=".9"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#1B3A6B' }}>DershaneOPS</div>
              <div style={{ fontSize: '10px', color: '#7A8FA8' }}>Ogretmen Paneli</div>
            </div>
          </div>
        </div>

        {profile && (
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #D5DFF0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#E2EAF8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#1B3A6B', flexShrink: 0 }}>
              {profile.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#1B3A6B' }}>{profile.full_name}</div>
              <div style={{ fontSize: '11px', color: '#7A8FA8' }}>Ogretmen</div>
            </div>
          </div>
        )}

        <nav style={{ flex: 1, padding: '8px' }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              display: 'block', width: '100%', textAlign: 'left', padding: '9px 12px', borderRadius: '8px', marginBottom: '2px',
              fontSize: '13px', fontWeight: activeTab === tab.id ? 600 : 500,
              color: activeTab === tab.id ? '#1B3A6B' : '#4A6080',
              background: activeTab === tab.id ? '#E2EAF8' : 'transparent',
              borderLeft: activeTab === tab.id ? '3px solid #1B3A6B' : '3px solid transparent',
              border: 'none', cursor: 'pointer'
            }}>
              {tab.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: '8px', borderTop: '1px solid #D5DFF0' }}>
          <a href="/dashboard" style={{ display: 'block', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', color: '#7A8FA8', textDecoration: 'none' }}>
            Admin Paneli
          </a>
          <a href="/api/auth/signout" style={{ display: 'block', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', color: '#C0392B', textDecoration: 'none' }}>
            Cikis Yap
          </a>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>

        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <div style={{ maxWidth: '900px' }}>
            <div style={{ marginBottom: '24px' }}>
              <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', margin: 0 }}>Hosgeldiniz, {profile?.full_name?.split(' ')[0]}</h1>
              <p style={{ fontSize: '12px', color: '#7A8FA8', margin: '3px 0 0' }}>
                {today.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '24px' }}>
              {[
                { label: 'Toplam Ogrenci', value: students.length, color: '#1B3A6B', bg: '#EEF3FB' },
                { label: 'Tamamlanan Ders', value: completedLessons, color: '#2E7D52', bg: '#EAF4EE' },
                { label: 'Iptal Edilen', value: cancelledLessons, color: '#C0392B', bg: '#FEF2F2' },
                { label: 'Bekleyen Odev', value: pendingHw, color: '#B45309', bg: '#FDF4E7' },
              ].map(m => (
                <div key={m.label} style={{ background: m.bg, borderRadius: '10px', padding: '14px 16px' }}>
                  <div style={{ fontSize: '11px', color: m.color, fontWeight: 600, marginBottom: '4px' }}>{m.label}</div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: m.color }}>{m.value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '18px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '14px' }}>Yaklasan Dersler</div>
                {upcomingLessons.length === 0 ? (
                  <div style={{ fontSize: '12px', color: '#7A8FA8', textAlign: 'center', padding: '20px' }}>Planli ders yok</div>
                ) : upcomingLessons.map((l, i) => (
                  <div key={l.id} style={{ padding: '10px 0', borderBottom: i < upcomingLessons.length - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1B3A6B', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#1B3A6B' }}>{l.subject}</div>
                      <div style={{ fontSize: '11.5px', color: '#7A8FA8' }}>{l.profiles?.full_name}</div>
                    </div>
                    <div style={{ fontSize: '11px', color: '#7A8FA8' }}>{formatDate(l.scheduled_at)}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '18px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '14px' }}>Ogrencilerim</div>
                {students.length === 0 ? (
                  <div style={{ fontSize: '12px', color: '#7A8FA8', textAlign: 'center', padding: '20px' }}>Ogrenci yok</div>
                ) : students.map((s, i) => {
                  const sHw = homework.filter(h => h.student_id === s.id)
                  const done = sHw.filter(h => h.status === 'completed').length
                  return (
                    <div key={s.id} style={{ padding: '10px 0', borderBottom: i < students.length - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#E2EAF8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#1B3A6B', flexShrink: 0 }}>
                        {s.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0,2)}
                      </div>
                      <div style={{ flex: 1, fontSize: '12.5px', fontWeight: 600, color: '#1B3A6B' }}>{s.full_name}</div>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: '#EAF4EE', color: '#2E7D52', fontWeight: 600 }}>{done} odev</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Derslerim */}
        {activeTab === 'lessons' && (
          <div style={{ maxWidth: '900px' }}>
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', marginBottom: '20px' }}>Tum Derslerim</h1>
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
              {lessons.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#7A8FA8' }}>Ders kaydi yok</div>
              ) : lessons.map((l, i) => {
                const isPast = new Date(l.scheduled_at) < today
                const STATUS: any = {
                  completed: { bg: '#EAF4EE', color: '#2E7D52', label: 'Tamamlandi' },
                  scheduled: { bg: '#EEF3FB', color: '#1B3A6B', label: 'Planli' },
                  cancelled: { bg: '#FEF2F2', color: '#C0392B', label: 'Iptal' },
                }
                const st = STATUS[l.status] ?? STATUS.scheduled
                return (
                  <div key={l.id} style={{ padding: '14px 18px', borderBottom: i < lessons.length - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', alignItems: 'center', gap: '14px', opacity: isPast && l.status === 'scheduled' ? 0.6 : 1 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#1B3A6B', marginBottom: '2px' }}>{l.subject}</div>
                      <div style={{ fontSize: '11.5px', color: '#7A8FA8' }}>{l.profiles?.full_name} — {formatDate(l.scheduled_at)}</div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 9px', borderRadius: '20px', background: st.bg, color: st.color }}>{st.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Ogrencilerim */}
        {activeTab === 'students' && (
          <div style={{ maxWidth: '900px' }}>
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', marginBottom: '20px' }}>Ogrencilerim</h1>
            {students.length === 0 ? (
              <div style={{ background: '#EAF4EE', border: '1px solid #A7D9B8', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
                <div style={{ fontSize: '13px', color: '#2E7D52' }}>Henuz ogrenci yok</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '14px' }}>
                {students.map(s => {
                  const sLessons = lessons.filter(l => l.student_id === s.id)
                  const sHw = homework.filter(h => h.student_id === s.id)
                  const completedHwCount = sHw.filter(h => h.status === 'completed').length
                  const nextLesson = sLessons.filter(l => new Date(l.scheduled_at) >= today && l.status === 'scheduled').sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0]
                  return (
                    <div key={s.id} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                        <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#E2EAF8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: '#1B3A6B', flexShrink: 0 }}>
                          {s.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0,2)}
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#1B3A6B' }}>{s.full_name}</div>
                          <div style={{ fontSize: '11.5px', color: '#7A8FA8' }}>Ogrenci</div>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '12px' }}>
                        {[
                          { label: 'Toplam Ders', value: sLessons.length, color: '#1B3A6B' },
                          { label: 'Odev', value: sHw.length, color: '#B45309' },
                          { label: 'Tamamlanan', value: completedHwCount, color: '#2E7D52' },
                        ].map(m => (
                          <div key={m.label} style={{ background: '#F5F8FF', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '16px', fontWeight: 700, color: m.color }}>{m.value}</div>
                            <div style={{ fontSize: '10px', color: '#7A8FA8' }}>{m.label}</div>
                          </div>
                        ))}
                      </div>
                      {nextLesson && (
                        <div style={{ background: '#F0F4F9', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#1B3A6B' }}>
                          Sonraki: {nextLesson.subject} — {formatDate(nextLesson.scheduled_at)}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Odevler */}
        {activeTab === 'homework' && (
          <div style={{ maxWidth: '900px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', margin: 0 }}>Odev Takibi</h1>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { label: 'Tamamlandi', value: completedHw, color: '#2E7D52', bg: '#EAF4EE' },
                  { label: 'Bekliyor', value: pendingHw, color: '#B45309', bg: '#FDF4E7' },
                ].map(m => (
                  <div key={m.label} style={{ background: m.bg, borderRadius: '8px', padding: '8px 14px', textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: m.color }}>{m.value}</div>
                    <div style={{ fontSize: '10px', color: m.color }}>{m.label}</div>
                  </div>
                ))}
              </div>
        </div>
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
              {homework.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#7A8FA8' }}>Odev yok</div>
              ) : homework.map((h, i) => {
                const isDone = h.status === 'completed'
                const isLate = !isDone && h.deadline && new Date(h.deadline) < today
                return (
                  <div key={h.id} style={{ padding: '13px 18px', borderBottom: i < homework.length - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#1B3A6B', marginBottom: '2px' }}>
                        {h.tests?.name} — {h.tests?.chapters?.books?.name}
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#7A8FA8' }}>
                        {h.profiles?.full_name}
                        {h.deadline && ` • Son: ${new Date(h.deadline).toLocaleDateString('tr-TR')}`}
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 9px', borderRadius: '20px', background: isDone ? '#EAF4EE' : isLate ? '#FEF2F2' : '#FDF4E7', color: isDone ? '#2E7D52' : isLate ? '#C0392B' : '#B45309' }}>
                      {isDone ? 'Tamamlandi' : isLate ? 'Gecikti' : 'Bekliyor'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
