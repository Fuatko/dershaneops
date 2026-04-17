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

    const { data: classroomData } = await supabase.from('classrooms').select('id, name')
    const classroomMap: Record<string, string> = {}
    for (const c of classroomData ?? []) classroomMap[c.id] = c.name

    const { data: ps } = await supabase.from('parent_students').select('student_id').eq('parent_id', p.id)
    let childrenData: any[] = []
    if (ps && ps.length > 0) {
      const ids = ps.map(x => x.student_id)
      const { data: kids } = await supabase.from('profiles').select('*').in('id', ids)
      childrenData = (kids ?? []).map(k => ({ ...k, classroom_name: k.classroom_id ? (classroomMap[k.classroom_id] ?? null) : null }))
    } else {
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

  async function signOut() { await supabase.auth.signOut(); window.location.href = '/login' }

  const totalQ = topicPerf.reduce((s, t) => s + t.total_questions, 0)
  const totalC = topicPerf.reduce((s, t) => s + t.correct_count, 0)
  const overallRate = totalQ > 0 ? Math.round(totalC / totalQ * 100) : 0
  const completedHw = homework.filter(h => h.status === 'completed').length
  const pendingHw = homework.filter(h => h.status !== 'completed').length
  const completedLessons = lessons.filter(l => l.status === 'completed').length
  const riskVal = Math.round(riskScore)
  const riskColor = riskVal >= 70 ? '#C0392B' : riskVal >= 45 ? '#B45309' : '#2E7D52'
  const rateColor = overallRate >= 70 ? '#2E7D52' : overallRate >= 50 ? '#B45309' : '#C0392B'

  function getLevelStyle(grade: number) {
    if (grade <= 4) return { color: '#2E7D52', bg: '#EAF4EE' }
    if (grade <= 8) return { color: '#1B3A6B', bg: '#EEF3FB' }
    return { color: '#6B4FC8', bg: '#F0ECFB' }
  }

  const TABS = [
    { id: 'overview', label: 'Genel', icon: '📊' },
    { id: 'performance', label: 'Performans', icon: '📈' },
    { id: 'homework', label: 'Ödevler', icon: '📝' },
    { id: 'lessons', label: 'Dersler', icon: '📅' },
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
    <div style={{ minHeight: '100vh', background: '#F0F4F9', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>

      {/* Mobil Header */}
      <div style={{ background: '#1B3A6B', padding: '12px 16px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: children.length > 1 ? '10px' : '0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>👨‍👩‍👧</div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>DershaneOPS</div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>Veli Paneli — {profile?.full_name?.split(' ')[0]}</div>
            </div>
          </div>
          <button onClick={signOut} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', padding: '6px 10px', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>
            Çıkış
          </button>
        </div>

        {/* Çocuk Seçimi */}
        {children.length > 1 && (
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
            {children.map(c => (
              <button key={c.id} onClick={() => selectChild(c)} style={{ padding: '5px 12px', borderRadius: '20px', border: '1.5px solid', borderColor: selectedChild?.id === c.id ? '#fff' : 'rgba(255,255,255,0.3)', background: selectedChild?.id === c.id ? '#fff' : 'transparent', color: selectedChild?.id === c.id ? '#1B3A6B' : '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {c.full_name?.split(' ')[0]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Çocuk Bilgi Kartı */}
      {selectedChild && (
        <div style={{ background: 'linear-gradient(135deg, #1B3A6B 0%, #2563EB 100%)', padding: '16px', marginBottom: '0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
              {selectedChild.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>{selectedChild.full_name}</div>
              <div style={{ display: 'flex', gap: '5px', marginTop: '4px', flexWrap: 'wrap' }}>
                {selectedChild.grade_level && (
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '8px', background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
                    {selectedChild.grade_level}. Sınıf
                  </span>
                )}
                {selectedChild.classroom_name && (
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '8px', background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)' }}>
                    {selectedChild.classroom_name}
                  </span>
                )}
                {streak && (
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}>
                    🔥 {streak.current_streak} gün
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Mini Metrikler */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px', marginTop: '14px' }}>
            {[
              { label: 'Başarı', value: '%' + overallRate, color: rateColor },
              { label: 'Risk', value: riskVal + '/100', color: riskColor },
              { label: 'Ödev', value: completedHw + '/' + homework.length, color: '#fff' },
              { label: 'Ders', value: completedLessons + '/' + lessons.length, color: '#fff' },
            ].map(m => (
              <div key={m.label} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff' }}>{m.value}</div>
                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alt Tab Bar */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #E2EAF8', display: 'flex', zIndex: 100, paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flex: 1, padding: '8px 4px 10px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
            <span style={{ fontSize: '20px' }}>{tab.icon}</span>
            <span style={{ fontSize: '9px', fontWeight: activeTab === tab.id ? 700 : 500, color: activeTab === tab.id ? '#1B3A6B' : '#9CA3AF' }}>{tab.label}</span>
            {activeTab === tab.id && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#1B3A6B' }} />}
          </button>
        ))}
      </div>

      {/* İçerik */}
      <div style={{ padding: '16px 16px 80px' }}>

        {/* GENEL DURUM */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
              <div style={{ background: '#EAF4EE', border: '1px solid #D1FAE5', borderRadius: '14px', padding: '14px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#2E7D52', marginBottom: '8px' }}>✓ Güçlü Konular</div>
                {topicPerf.filter(t => t.accuracy_rate >= 70).length === 0 ? (
                  <div style={{ fontSize: '11px', color: '#7A8FA8' }}>Henüz veri yok</div>
                ) : topicPerf.filter(t => t.accuracy_rate >= 70).slice(0, 4).map(t => (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(0,0,0,0.05)', fontSize: '11.5px' }}>
                    <span style={{ color: '#374151' }}>{t.topics?.name ?? 'Genel'}</span>
                    <strong style={{ color: '#2E7D52' }}>%{Math.round(t.accuracy_rate)}</strong>
                  </div>
                ))}
              </div>

              <div style={{ background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: '14px', padding: '14px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#C0392B', marginBottom: '8px' }}>⚠ Gelişim</div>
                {topicPerf.filter(t => t.accuracy_rate < 50).length === 0 ? (
                  <div style={{ fontSize: '11px', color: '#2E7D52', fontWeight: 600 }}>Kritik alan yok!</div>
                ) : topicPerf.filter(t => t.accuracy_rate < 50).slice(0, 4).map(t => (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(0,0,0,0.05)', fontSize: '11.5px' }}>
                    <span style={{ color: '#374151' }}>{t.topics?.name ?? 'Genel'}</span>
                    <strong style={{ color: '#C0392B' }}>%{Math.round(t.accuracy_rate)}</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Hedefler */}
            {goals.length > 0 && (
              <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '12px' }}>🎯 Hedefler</div>
                {goals.map(g => {
                  const prog = g.target_score > 0 ? Math.min(Math.round(g.current_score / g.target_score * 100), 100) : 0
                  const pColor = prog >= 80 ? '#2E7D52' : prog >= 50 ? '#B45309' : '#1B3A6B'
                  return (
                    <div key={g.id} style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>{g.target_exam}</span>
                        <span style={{ fontSize: '12px', color: '#7A8FA8' }}>{g.current_score} / {g.target_score}</span>
                      </div>
                      <div style={{ height: '8px', background: '#F0F4F9', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: prog + '%', background: pColor, borderRadius: '4px' }} />
                      </div>
                      <div style={{ fontSize: '10px', color: pColor, fontWeight: 700, marginTop: '3px', textAlign: 'right' }}>%{prog}</div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Risk Uyarısı */}
            {riskVal >= 45 && (
              <div style={{ background: riskVal >= 70 ? '#FEF2F2' : '#FDF4E7', border: '1px solid ' + (riskVal >= 70 ? '#FECACA' : '#FED7AA'), borderRadius: '14px', padding: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '28px' }}>{riskVal >= 70 ? '🚨' : '⚠️'}</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: riskColor }}>
                    {riskVal >= 70 ? 'Kritik Risk Seviyesi!' : 'Dikkat Edilmeli'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#7A8FA8', marginTop: '2px' }}>
                    Risk skoru: {riskVal}/100 — Öğretmenle görüşün
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PERFORMANS */}
        {activeTab === 'performance' && (
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#1B3A6B', marginBottom: '12px' }}>📈 Konu Performansı</div>
            {topicPerf.length === 0 ? (
              <div style={{ background: '#F8FAFF', borderRadius: '12px', padding: '32px', textAlign: 'center', color: '#7A8FA8' }}>Henüz veri yok</div>
            ) : topicPerf.map(t => {
              const color = t.accuracy_rate >= 70 ? '#2E7D52' : t.accuracy_rate >= 50 ? '#B45309' : '#C0392B'
              return (
                <div key={t.id} style={{ background: '#fff', borderRadius: '12px', padding: '12px 14px', marginBottom: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>{t.topics?.name ?? 'Genel'}</div>
                      <div style={{ fontSize: '11px', color: '#7A8FA8' }}>{t.subjects?.name}</div>
                    </div>
                    <span style={{ fontSize: '18px', fontWeight: 800, color }}>%{Math.round(t.accuracy_rate)}</span>
                  </div>
                  <div style={{ height: '6px', background: '#F0F4F9', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: Math.min(t.accuracy_rate, 100) + '%', background: color, borderRadius: '3px' }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ÖDEVLER */}
        {activeTab === 'homework' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#1B3A6B' }}>📝 Ödevler</div>
              <div style={{ display: 'flex', gap: '5px' }}>
                <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '10px', background: '#FDF4E7', color: '#B45309', fontWeight: 600 }}>{pendingHw} bekliyor</span>
                <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '10px', background: '#EAF4EE', color: '#2E7D52', fontWeight: 600 }}>{completedHw} tamam</span>
              </div>
            </div>
            {homework.length === 0 ? (
              <div style={{ background: '#F8FAFF', borderRadius: '12px', padding: '32px', textAlign: 'center', color: '#7A8FA8' }}>Henüz ödev yok</div>
            ) : homework.map(h => {
              const isDone = h.status === 'completed'
              const isLate = !isDone && h.deadline && new Date(h.deadline) < new Date()
              return (
                <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '13px', marginBottom: '8px', borderRadius: '14px', background: '#fff', border: '1px solid', borderColor: isDone ? '#D1FAE5' : isLate ? '#FECACA' : '#E2EAF8', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: isDone ? '#EAF4EE' : isLate ? '#FEF2F2' : '#EEF3FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                    {isDone ? '✅' : isLate ? '⏰' : '📝'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '2px' }}>{h.tests?.name}</div>
                    <div style={{ fontSize: '11px', color: '#7A8FA8' }}>{h.tests?.chapters?.books?.name}</div>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', background: isDone ? '#EAF4EE' : isLate ? '#FEF2F2' : '#FDF4E7', color: isDone ? '#2E7D52' : isLate ? '#C0392B' : '#B45309', flexShrink: 0 }}>
                    {isDone ? 'Tamam' : isLate ? 'Gecikti' : 'Bekliyor'}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* DERSLER */}
        {activeTab === 'lessons' && (
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#1B3A6B', marginBottom: '12px' }}>📅 Dersler</div>
            {lessons.length === 0 ? (
              <div style={{ background: '#F8FAFF', borderRadius: '12px', padding: '32px', textAlign: 'center', color: '#7A8FA8' }}>Ders kaydı yok</div>
            ) : lessons.map(l => {
              const STATUS: any = {
                completed: { bg: '#EAF4EE', color: '#2E7D52', label: 'Tamamlandı' },
                scheduled: { bg: '#EEF3FB', color: '#1B3A6B', label: 'Planlandı' },
                cancelled: { bg: '#FEF2F2', color: '#C0392B', label: 'İptal' },
              }
              const st = STATUS[l.status] ?? STATUS.scheduled
              return (
                <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '13px', marginBottom: '8px', borderRadius: '14px', background: '#fff', border: '1px solid #E2EAF8', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: st.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: st.color }}>{new Date(l.scheduled_at).toLocaleDateString('tr-TR', { day: 'numeric' })}</div>
                    <div style={{ fontSize: '9px', color: st.color }}>{new Date(l.scheduled_at).toLocaleDateString('tr-TR', { month: 'short' })}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '2px' }}>{l.subject}</div>
                    <div style={{ fontSize: '11px', color: '#7A8FA8' }}>
                      {(l.profiles as any)?.full_name} • {new Date(l.scheduled_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 9px', borderRadius: '20px', background: st.bg, color: st.color, flexShrink: 0 }}>
                    {st.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}