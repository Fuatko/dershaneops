'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ParentPanelPage() {
  const [profile, setProfile] = useState<any>(null)
  const [children, setChildren] = useState<any[]>([])
  const [selectedChild, setSelectedChild] = useState<any>(null)
  const [topicPerf, setTopicPerf] = useState<any[]>([])
  const [homework, setHomework] = useState<any[]>([])
  const [lessons, setLessons] = useState<any[]>([])
  const [riskScore, setRiskScore] = useState(0)
  const [goals, setGoals] = useState<any[]>([])
  const [streak, setStreak] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    const { data: p } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()
    if (!p) { setLoading(false); return }
    setProfile(p)

    // Classroom map
    const { data: classroomData } = await supabase.from('classrooms').select('id, name')
    const classroomMap: Record<string, string> = {}
    for (const c of classroomData ?? []) classroomMap[c.id] = c.name

    // Çocukları bul
    const { data: ps } = await supabase.from('parent_students').select('student_id').eq('parent_id', p.id)
    let childrenData: any[] = []
    if (ps && ps.length > 0) {
      const ids = ps.map(x => x.student_id)
      const { data: kids } = await supabase.from('profiles').select('*').in('id', ids)
      childrenData = (kids ?? []).map(k => ({ ...k, classroom_name: k.classroom_id ? (classroomMap[k.classroom_id] ?? null) : null }))
    } else {
      // Fallback: aynı tenant'taki öğrenciler
      const { data: kids } = await supabase.from('profiles').select('*').eq('role', 'student').limit(5)
      childrenData = (kids ?? []).map(k => ({ ...k, classroom_name: k.classroom_id ? (classroomMap[k.classroom_id] ?? null) : null }))
    }

    setChildren(childrenData)
    if (childrenData.length > 0) await selectChild(childrenData[0])
    setLoading(false)
  }

  async function selectChild(child: any) {
    setSelectedChild(child)
    const [{ data: tp }, { data: hw }, { data: l }, { data: g }, { data: risk }, { data: st }] = await Promise.all([
      supabase.from('student_topic_performance').select('*, topics(name), subjects(name)').eq('student_id', child.id).order('accuracy_rate', { ascending: true }),
      supabase.from('homework_assignments').select('*, tests(name, chapters(name, books(name)))').eq('student_id', child.id).order('created_at', { ascending: false }),
      supabase.from('lessons').select('*, profiles!lessons_teacher_id_fkey(full_name)').eq('student_id', child.id).order('scheduled_at', { ascending: false }).limit(10),
      supabase.from('student_goals').select('*').eq('student_id', child.id).eq('status', 'active'),
      supabase.rpc('calculate_risk_score', { p_student_id: child.id }),
      supabase.from('student_streaks').select('*').eq('student_id', child.id).single(),
    ])
    setTopicPerf(tp ?? [])
    setHomework(hw ?? [])
    setLessons(l ?? [])
    setGoals(g ?? [])
    setRiskScore(risk ?? 0)
    setStreak(st)
  }

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  function getLevelStyle(grade: number) {
    if (grade <= 4) return { color: '#2E7D52', bg: '#EAF4EE' }
    if (grade <= 8) return { color: '#1B3A6B', bg: '#EEF3FB' }
    return { color: '#6B4FC8', bg: '#F0ECFB' }
  }

  const totalQ = topicPerf.reduce((s, t) => s + t.total_questions, 0)
  const totalC = topicPerf.reduce((s, t) => s + t.correct_count, 0)
  const overallRate = totalQ > 0 ? Math.round(totalC / totalQ * 100) : 0
  const completedHw = homework.filter(h => h.status === 'completed').length
  const pendingHw = homework.filter(h => h.status !== 'completed').length
  const completedLessons = lessons.filter(l => l.status === 'completed').length
  const riskVal = Math.round(riskScore)
  const riskColor = riskVal >= 70 ? '#C0392B' : riskVal >= 45 ? '#B45309' : '#2E7D52'
  const rateColor = overallRate >= 70 ? '#2E7D52' : overallRate >= 50 ? '#B45309' : '#C0392B'

  const TABS = [
    { id: 'overview', label: '📊 Genel Durum' },
    { id: 'performance', label: '📈 Performans' },
    { id: 'homework', label: '📝 Ödevler' },
    { id: 'lessons', label: '📅 Dersler' },
  ]

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#F0F4F9' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '36px', marginBottom: '12px' }}>👨‍👩‍👧</div>
        <div style={{ fontSize: '14px', color: '#7A8FA8' }}>Yükleniyor...</div>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#F0F4F9', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      <aside style={{ width: '220px', background: '#fff', borderRight: '1px solid #D5DFF0', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '18px 16px', borderBottom: '1px solid #D5DFF0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '7px', background: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="5" r="3" stroke="white" strokeWidth="1.5"/>
                <path d="M1 13c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#1B3A6B' }}>DershaneOPS</div>
              <div style={{ fontSize: '10px', color: '#7A8FA8' }}>Veli Paneli</div>
            </div>
          </div>
        </div>

        {profile && (
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #D5DFF0' }}>
            <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#1B3A6B', marginBottom: '2px' }}>{profile.full_name}</div>
            <div style={{ fontSize: '10px', color: '#B45309', fontWeight: 600 }}>Veli</div>
          </div>
        )}

        {/* Çocuk seçimi */}
        {children.length > 1 && (
          <div style={{ padding: '12px', borderBottom: '1px solid #D5DFF0' }}>
            <div style={{ fontSize: '10px', color: '#7A8FA8', fontWeight: 600, marginBottom: '6px' }}>ÇOCUĞUM</div>
            {children.map(c => {
              const lv = c.grade_level ? getLevelStyle(c.grade_level) : null
              return (
                <div key={c.id} onClick={() => selectChild(c)} style={{ padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', background: selectedChild?.id === c.id ? '#EEF3FB' : 'transparent', marginBottom: '3px' }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#1B3A6B' }}>{c.full_name}</div>
                  <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                    {lv && c.grade_level && (
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 5px', borderRadius: '5px', background: lv.bg, color: lv.color }}>
                        {c.grade_level}. Sınıf
                      </span>
                    )}
                    {c.classroom_name && (
                      <span style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '5px', background: '#F0F4F9', color: '#4A6080', fontWeight: 600 }}>
                        {c.classroom_name}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <nav style={{ flex: 1, padding: '8px' }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 12px', borderRadius: '8px', marginBottom: '2px', fontSize: '13px', fontWeight: activeTab === tab.id ? 600 : 500, color: activeTab === tab.id ? '#1B3A6B' : '#4A6080', background: activeTab === tab.id ? '#E2EAF8' : 'transparent', borderLeft: activeTab === tab.id ? '3px solid #1B3A6B' : '3px solid transparent', border: 'none', cursor: 'pointer' }}>
              {tab.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: '8px', borderTop: '1px solid #D5DFF0' }}>
          <button onClick={signOut} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', color: '#C0392B', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
            Çıkış Yap
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>

        {/* Çocuk Başlık */}
        {selectedChild && (
          <div style={{ background: '#1B3A6B', borderRadius: '14px', padding: '18px 22px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              {selectedChild.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>{selectedChild.full_name}</div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {selectedChild.grade_level && (
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '8px', background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
                    {selectedChild.grade_level}. Sınıf
                  </span>
                )}
                {selectedChild.classroom_name && (
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '8px', background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)' }}>
                    {selectedChild.classroom_name}
                  </span>
                )}
                {streak && (
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}>
                    🔥 {streak.current_streak} gün serisi
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* GENEL DURUM */}
        {activeTab === 'overview' && (
          <div style={{ maxWidth: '800px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '20px' }}>
              {[
                { label: 'Genel Başarı', value: '%' + overallRate, color: rateColor, bg: overallRate >= 70 ? '#EAF4EE' : overallRate >= 50 ? '#FDF4E7' : '#FEF2F2' },
                { label: 'Risk Skoru', value: riskVal + '/100', color: riskColor, bg: riskVal >= 70 ? '#FEF2F2' : riskVal >= 45 ? '#FDF4E7' : '#EAF4EE' },
                { label: 'Tamamlanan Ödev', value: completedHw + '/' + homework.length, color: '#6B4FC8', bg: '#F0ECFB' },
                { label: 'Tamamlanan Ders', value: completedLessons + '/' + lessons.length, color: '#1B3A6B', bg: '#EEF3FB' },
              ].map(m => (
                <div key={m.label} style={{ background: m.bg, borderRadius: '10px', padding: '14px' }}>
                  <div style={{ fontSize: '11px', color: m.color, fontWeight: 600, marginBottom: '3px' }}>{m.label}</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: m.color }}>{m.value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div style={{ background: '#EAF4EE', border: '1px solid #D1FAE5', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#2E7D52', marginBottom: '8px' }}>✓ Güçlü Konular</div>
                {topicPerf.filter(t => t.accuracy_rate >= 70).length === 0 ? (
                  <div style={{ fontSize: '12px', color: '#7A8FA8' }}>Henüz veri yok</div>
                ) : topicPerf.filter(t => t.accuracy_rate >= 70).slice(0, 4).map(t => (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(0,0,0,0.05)', fontSize: '12px' }}>
                    <span style={{ color: '#374151' }}>{t.subjects?.name} — {t.topics?.name ?? 'Genel'}</span>
                    <strong style={{ color: '#2E7D52' }}>%{Math.round(t.accuracy_rate)}</strong>
                  </div>
                ))}
              </div>

              <div style={{ background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#C0392B', marginBottom: '8px' }}>⚠ Gelişim Alanları</div>
                {topicPerf.filter(t => t.accuracy_rate < 50).length === 0 ? (
                  <div style={{ fontSize: '12px', color: '#2E7D52', fontWeight: 600 }}>Kritik alan yok!</div>
                ) : topicPerf.filter(t => t.accuracy_rate < 50).slice(0, 4).map(t => (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(0,0,0,0.05)', fontSize: '12px' }}>
                    <span style={{ color: '#374151' }}>{t.subjects?.name} — {t.topics?.name ?? 'Genel'}</span>
                    <strong style={{ color: '#C0392B' }}>%{Math.round(t.accuracy_rate)}</strong>
                  </div>
                ))}
              </div>

              {goals.length > 0 && (
                <div style={{ background: '#fff', border: '1px solid #D5DFF0', borderRadius: '12px', padding: '16px', gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#1B3A6B', marginBottom: '10px' }}>🎯 Hedefler</div>
                  {goals.map(g => {
                    const prog = g.target_score > 0 ? Math.min(Math.round(g.current_score / g.target_score * 100), 100) : 0
                    return (
                      <div key={g.id} style={{ marginBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                          <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#1B3A6B' }}>{g.target_exam}</span>
                          <span style={{ fontSize: '12px', color: '#7A8FA8' }}>Hedef: {g.target_score} — Mevcut: {g.current_score}</span>
                        </div>
                        <div style={{ height: '8px', background: '#F0F4F9', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: prog + '%', background: prog >= 80 ? '#2E7D52' : prog >= 50 ? '#B45309' : '#1B3A6B', borderRadius: '4px' }} />
                        </div>
                        <div style={{ fontSize: '11px', color: '#7A8FA8', marginTop: '3px' }}>%{prog} tamamlandı</div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PERFORMANS */}
        {activeTab === 'performance' && (
          <div style={{ maxWidth: '700px' }}>
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', marginBottom: '20px' }}>Konu Performansı</h1>
            {topicPerf.length === 0 ? (
              <div style={{ background: '#F8FAFF', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '40px', textAlign: 'center', color: '#7A8FA8' }}>Henüz veri yok</div>
            ) : (
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {topicPerf.map(t => {
                  const color = t.accuracy_rate >= 70 ? '#2E7D52' : t.accuracy_rate >= 50 ? '#B45309' : '#C0392B'
                  const bg = t.accuracy_rate >= 70 ? '#EAF4EE' : t.accuracy_rate >= 50 ? '#FDF4E7' : '#FEF2F2'
                  return (
                    <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px', background: bg }}>
                      <div style={{ width: '120px', flexShrink: 0 }}>
                        <div style={{ fontSize: '12.5px', fontWeight: 700, color }}>{t.topics?.name ?? 'Genel'}</div>
                        <div style={{ fontSize: '10.5px', color: '#7A8FA8' }}>{t.subjects?.name}</div>
                      </div>
                      <div style={{ flex: 1, height: '8px', background: 'rgba(0,0,0,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: Math.min(t.accuracy_rate, 100) + '%', background: color, borderRadius: '4px' }} />
                      </div>
                      <span style={{ fontSize: '15px', fontWeight: 800, color, width: '44px', textAlign: 'right', flexShrink: 0 }}>
                        %{Math.round(t.accuracy_rate)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ÖDEVLER */}
        {activeTab === 'homework' && (
          <div style={{ maxWidth: '700px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', margin: 0 }}>Ödevler</h1>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '20px', background: '#FDF4E7', color: '#B45309', fontWeight: 600 }}>Bekleyen: {pendingHw}</span>
                <span style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '20px', background: '#EAF4EE', color: '#2E7D52', fontWeight: 600 }}>Tamam: {completedHw}</span>
              </div>
            </div>
            {homework.length === 0 ? (
              <div style={{ background: '#F8FAFF', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '40px', textAlign: 'center', color: '#7A8FA8' }}>Henüz ödev yok</div>
            ) : homework.map((h, i) => {
              const isDone = h.status === 'completed'
              const isLate = !isDone && h.deadline && new Date(h.deadline) < new Date()
              return (
                <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px', marginBottom: '8px', borderRadius: '12px', background: '#fff', border: '1px solid', borderColor: isDone ? '#D1FAE5' : isLate ? '#FECACA' : '#D5DFF0' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: isDone ? '#EAF4EE' : isLate ? '#FEF2F2' : '#EEF3FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                    {isDone ? '✅' : isLate ? '⏰' : '📝'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '2px' }}>{h.tests?.name}</div>
                    <div style={{ fontSize: '11.5px', color: '#7A8FA8' }}>{h.tests?.chapters?.books?.name}</div>
                  </div>
                  <span style={{ fontSize: '11.5px', fontWeight: 700, padding: '4px 12px', borderRadius: '20px', background: isDone ? '#EAF4EE' : isLate ? '#FEF2F2' : '#FDF4E7', color: isDone ? '#2E7D52' : isLate ? '#C0392B' : '#B45309' }}>
                    {isDone ? 'Tamam' : isLate ? 'Gecikti!' : 'Bekliyor'}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* DERSLER */}
        {activeTab === 'lessons' && (
          <div style={{ maxWidth: '700px' }}>
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', marginBottom: '20px' }}>Dersler</h1>
            {lessons.length === 0 ? (
              <div style={{ background: '#F8FAFF', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '40px', textAlign: 'center', color: '#7A8FA8' }}>Ders kaydı yok</div>
            ) : lessons.map((l, i) => {
              const STATUS: any = {
                completed: { bg: '#EAF4EE', color: '#2E7D52', label: 'Tamamlandı' },
                scheduled: { bg: '#EEF3FB', color: '#1B3A6B', label: 'Planlandı' },
                cancelled: { bg: '#FEF2F2', color: '#C0392B', label: 'İptal' },
              }
              const st = STATUS[l.status] ?? STATUS.scheduled
              return (
                <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px', marginBottom: '8px', borderRadius: '12px', background: '#fff', border: '1px solid #D5DFF0' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: st.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: st.color }}>{new Date(l.scheduled_at).toLocaleDateString('tr-TR', { day: 'numeric' })}</div>
                    <div style={{ fontSize: '9px', color: st.color }}>{new Date(l.scheduled_at).toLocaleDateString('tr-TR', { month: 'short' })}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '2px' }}>{l.subject}</div>
                    <div style={{ fontSize: '11.5px', color: '#7A8FA8' }}>
                      {(l.profiles as any)?.full_name} • {new Date(l.scheduled_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', background: st.bg, color: st.color }}>
                    {st.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}