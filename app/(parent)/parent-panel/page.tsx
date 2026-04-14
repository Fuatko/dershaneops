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

    const { data: ps } = await supabase
      .from('parent_students')
      .select('student_id, profiles!parent_students_student_id_fkey(id, full_name, created_at)')
      .eq('parent_id', p.id)

    const childList = (ps ?? []).map((x: any) => x.profiles).filter(Boolean)

    if (childList.length === 0) {
      const { data: allStudents } = await supabase.from('profiles').select('id, full_name, created_at').eq('role', 'student').eq('tenant_id', p.tenant_id)
      setChildren(allStudents ?? [])
      if (allStudents && allStudents.length > 0) await loadChildData(allStudents[0])
    } else {
      setChildren(childList)
      await loadChildData(childList[0])
    }
    setLoading(false)
  }

  async function loadChildData(child: any) {
    setSelectedChild(child)

    const [{ data: tp }, { data: hw }, { data: l }, { data: risk }] = await Promise.all([
      supabase.from('student_topic_performance').select('*, topics(name), subjects(name, color)').eq('student_id', child.id).order('accuracy_rate', { ascending: false }),
      supabase.from('homework_assignments').select('*, tests(name, chapters(name, books(name)))').eq('student_id', child.id).order('created_at', { ascending: false }),
      supabase.from('lessons').select('*, profiles!lessons_teacher_id_fkey(full_name)').eq('student_id', child.id).order('scheduled_at', { ascending: false }).limit(10),
      supabase.rpc('calculate_risk_score', { p_student_id: child.id }),
    ])

    setTopicPerf(tp ?? [])
    setHomework(hw ?? [])
    setLessons(l ?? [])
    setRiskScore(risk ?? 0)
  }

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const totalQ = topicPerf.reduce((s, t) => s + t.total_questions, 0)
  const totalC = topicPerf.reduce((s, t) => s + t.correct_count, 0)
  const overallRate = totalQ > 0 ? Math.round(totalC / totalQ * 100) : 0
  const completedHw = homework.filter(h => h.status === 'completed').length
  const pendingHw = homework.filter(h => h.status !== 'completed').length
  const completedL = lessons.filter(l => l.status === 'completed').length
  const strongTopics = topicPerf.filter(t => t.accuracy_rate >= 70)
  const weakTopics = topicPerf.filter(t => t.accuracy_rate < 50)

  function getRiskLabel(score: number) {
    if (score >= 70) return { label: 'Kritik', color: '#C0392B', bg: '#FEF2F2' }
    if (score >= 45) return { label: 'Yüksek', color: '#B45309', bg: '#FDF4E7' }
    if (score >= 20) return { label: 'Orta', color: '#1B3A6B', bg: '#EEF3FB' }
    return { label: 'İyi', color: '#2E7D52', bg: '#EAF4EE' }
  }

  const rl = getRiskLabel(riskScore)

  const TABS = [
    { id: 'dashboard', label: 'Genel Durum' },
    { id: 'performance', label: 'Performans' },
    { id: 'homework', label: 'Ödevler' },
    { id: 'lessons', label: 'Dersler' },
  ]

  if (loading) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', color: '#7A8FA8' }}>Yükleniyor...</div>

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#F0F4F9', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>

      {/* Sidebar */}
      <aside style={{ width: '220px', background: '#fff', borderRight: '1px solid #D5DFF0', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '18px 16px', borderBottom: '1px solid #D5DFF0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '7px', background: '#6B4FC8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="1" width="5" height="5" rx="1" fill="white" opacity=".9"/>
                <rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity=".5"/>
                <rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity=".5"/>
                <rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity=".9"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#1B3A6B' }}>DershaneOPS</div>
              <div style={{ fontSize: '10px', color: '#7A8FA8' }}>Veli Paneli</div>
            </div>
          </div>
        </div>

        {profile && (
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #D5DFF0' }}>
            <div style={{ fontSize: '11px', color: '#7A8FA8', marginBottom: '6px', fontWeight: 600 }}>HOŞGELDİNİZ</div>
            <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#1B3A6B' }}>{profile.full_name}</div>
          </div>
        )}

        {children.length > 1 && (
          <div style={{ padding: '10px 8px', borderBottom: '1px solid #D5DFF0' }}>
            <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#7A8FA8', padding: '0 8px 6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Çocuğunuz</div>
            {children.map(c => (
              <button key={c.id} onClick={() => loadChildData(c)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: '7px', marginBottom: '2px', fontSize: '12.5px', fontWeight: selectedChild?.id === c.id ? 700 : 500, color: '#1B3A6B', background: selectedChild?.id === c.id ? '#E2EAF8' : 'transparent', border: 'none', cursor: 'pointer' }}>
                {c.full_name}
              </button>
            ))}
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

      {/* Main */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>

        {!selectedChild ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#7A8FA8' }}>Öğrenci verisi bulunamadı</div>
        ) : (
          <>
            {/* GENEL DURUM */}
            {activeTab === 'dashboard' && (
              <div style={{ maxWidth: '900px' }}>
                <div style={{ marginBottom: '24px' }}>
                  <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', margin: 0 }}>{selectedChild.full_name}</h1>
                  <p style={{ fontSize: '12px', color: '#7A8FA8', margin: '3px 0 0' }}>Akademik gelişim özeti</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '24px' }}>
                  {[
                    { label: 'Genel Başarı', value: '%' + overallRate, color: overallRate >= 70 ? '#2E7D52' : overallRate >= 50 ? '#B45309' : '#C0392B', bg: overallRate >= 70 ? '#EAF4EE' : overallRate >= 50 ? '#FDF4E7' : '#FEF2F2' },
                    { label: 'Risk Durumu', value: rl.label, color: rl.color, bg: rl.bg },
                    { label: 'Tamamlanan Ödev', value: completedHw + '/' + homework.length, color: '#1B3A6B', bg: '#EEF3FB' },
                    { label: 'Tamamlanan Ders', value: completedL + '/' + lessons.length, color: '#6B4FC8', bg: '#F0ECFB' },
                  ].map(m => (
                    <div key={m.label} style={{ background: m.bg, borderRadius: '10px', padding: '14px 16px' }}>
                      <div style={{ fontSize: '11px', color: m.color, fontWeight: 600, marginBottom: '4px' }}>{m.label}</div>
                      <div style={{ fontSize: '22px', fontWeight: 700, color: m.color }}>{m.value}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '18px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#2E7D52', marginBottom: '12px' }}>Güçlü Yönler ({strongTopics.length})</div>
                    {strongTopics.length === 0 ? (
                      <div style={{ fontSize: '12px', color: '#7A8FA8' }}>Henüz yeterli veri yok</div>
                    ) : strongTopics.slice(0, 4).map(t => (
                      <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F0F4F9', fontSize: '12.5px' }}>
                        <span style={{ color: '#374151' }}>{t.subjects?.name} — {t.topics?.name}</span>
                        <span style={{ fontWeight: 700, color: '#2E7D52' }}>%{Math.round(t.accuracy_rate)}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '18px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#C0392B', marginBottom: '12px' }}>Gelişim Alanları ({weakTopics.length})</div>
                    {weakTopics.length === 0 ? (
                      <div style={{ fontSize: '12px', color: '#2E7D52' }}>Kritik alan yok!</div>
                    ) : weakTopics.slice(0, 4).map(t => (
                      <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F0F4F9', fontSize: '12.5px' }}>
                        <span style={{ color: '#374151' }}>{t.subjects?.name} — {t.topics?.name}</span>
                        <span style={{ fontWeight: 700, color: '#C0392B' }}>%{Math.round(t.accuracy_rate)}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '18px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '12px' }}>Son Ödevler</div>
                    {homework.slice(0, 4).map((h, i) => (
                      <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 0', borderBottom: i < 3 ? '1px solid #F0F4F9' : 'none' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: h.status === 'completed' ? '#2E7D52' : '#B45309', flexShrink: 0 }} />
                        <span style={{ flex: 1, fontSize: '12.5px', color: '#374151' }}>{h.tests?.name}</span>
                        <span style={{ fontSize: '10.5px', fontWeight: 600, padding: '2px 7px', borderRadius: '8px', background: h.status === 'completed' ? '#EAF4EE' : '#FDF4E7', color: h.status === 'completed' ? '#2E7D52' : '#B45309' }}>
                          {h.status === 'completed' ? 'Tamam' : 'Bekliyor'}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '18px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '12px' }}>Son Dersler</div>
                    {lessons.slice(0, 4).map((l, i) => (
                      <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 0', borderBottom: i < 3 ? '1px solid #F0F4F9' : 'none' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: l.status === 'completed' ? '#2E7D52' : '#1B3A6B', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '12.5px', color: '#374151' }}>{l.subject}</div>
                          <div style={{ fontSize: '11px', color: '#7A8FA8' }}>{l.profiles?.full_name}</div>
                        </div>
                        <span style={{ fontSize: '11px', color: '#7A8FA8' }}>{new Date(l.scheduled_at).toLocaleDateString('tr-TR')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* PERFORMANS */}
            {activeTab === 'performance' && (
              <div style={{ maxWidth: '900px' }}>
                <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', marginBottom: '20px' }}>Konu Performansı</h1>
                {topicPerf.length === 0 ? (
                  <div style={{ background: '#FDF4E7', border: '1px solid #FED7AA', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
                    <div style={{ fontSize: '13px', color: '#B45309' }}>Henüz veri yok</div>
                  </div>
                ) : (
                  <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '20px' }}>
                    {topicPerf.map(t => {
                      const color = t.accuracy_rate >= 70 ? '#2E7D52' : t.accuracy_rate >= 50 ? '#B45309' : '#C0392B'
                      const bg = t.accuracy_rate >= 70 ? '#EAF4EE' : t.accuracy_rate >= 50 ? '#FDF4E7' : '#FEF2F2'
                      return (
                        <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', borderRadius: '8px', background: bg, marginBottom: '8px' }}>
                          <div style={{ width: '140px', flexShrink: 0 }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color }}>{t.topics?.name}</div>
                            <div style={{ fontSize: '10.5px', color: '#7A8FA8' }}>{t.subjects?.name}</div>
                          </div>
                          <div style={{ flex: 1, height: '8px', background: 'rgba(0,0,0,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: Math.min(t.accuracy_rate, 100) + '%', background: color, borderRadius: '4px' }} />
                          </div>
                          <span style={{ fontSize: '14px', fontWeight: 800, color, width: '44px', textAlign: 'right' }}>%{Math.round(t.accuracy_rate)}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ÖDEVLERİ */}
            {activeTab === 'homework' && (
              <div style={{ maxWidth: '900px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', margin: 0 }}>Ödevler</h1>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '8px', background: '#FDF4E7', color: '#B45309', fontWeight: 600 }}>Bekleyen: {pendingHw}</span>
                    <span style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '8px', background: '#EAF4EE', color: '#2E7D52', fontWeight: 600 }}>Tamamlanan: {completedHw}</span>
                  </div>
                </div>
                <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
                  {homework.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#7A8FA8' }}>Ödev yok</div>
                  ) : homework.map((h, i) => {
                    const isDone = h.status === 'completed'
                    return (
                      <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '13px 18px', borderBottom: i < homework.length - 1 ? '1px solid #F0F4F9' : 'none' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: isDone ? '#EAF4EE' : '#EEF3FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: isDone ? '#2E7D52' : '#1B3A6B', flexShrink: 0 }}>
                          {isDone ? '✓' : '—'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#1B3A6B' }}>{h.tests?.name}</div>
                          <div style={{ fontSize: '11.5px', color: '#7A8FA8' }}>{h.tests?.chapters?.books?.name}</div>
                        </div>
                        <span style={{ fontSize: '11.5px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', background: isDone ? '#EAF4EE' : '#FDF4E7', color: isDone ? '#2E7D52' : '#B45309' }}>
                          {isDone ? 'Tamamlandı' : 'Bekliyor'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* DERSLER */}
            {activeTab === 'lessons' && (
              <div style={{ maxWidth: '900px' }}>
                <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', marginBottom: '20px' }}>Dersler ({lessons.length})</h1>
                <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
                  {lessons.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#7A8FA8' }}>Ders kaydı yok</div>
                  ) : lessons.map((l, i) => {
                    const STATUS: any = {
                      completed: { bg: '#EAF4EE', color: '#2E7D52', label: 'Tamamlandı' },
                      scheduled: { bg: '#EEF3FB', color: '#1B3A6B', label: 'Planlandı' },
                      cancelled: { bg: '#FEF2F2', color: '#C0392B', label: 'İptal' },
                    }
                    const st = STATUS[l.status] ?? STATUS.scheduled
                    return (
                      <div key={l.id} style={{ padding: '13px 18px', borderBottom: i < lessons.length - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#1B3A6B', marginBottom: '2px' }}>{l.subject}</div>
                          <div style={{ fontSize: '11.5px', color: '#7A8FA8' }}>
                            Öğretmen: {l.profiles?.full_name} — {new Date(l.scheduled_at).toLocaleDateString('tr-TR')}
                          </div>
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 9px', borderRadius: '20px', background: st.bg, color: st.color }}>{st.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}