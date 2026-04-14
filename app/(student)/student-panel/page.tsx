'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function StudentPanelPage() {
  const [profile, setProfile] = useState<any>(null)
  const [topicPerf, setTopicPerf] = useState<any[]>([])
  const [homework, setHomework] = useState<any[]>([])
  const [studyPlan, setStudyPlan] = useState<any>(null)
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

    const [{ data: tp }, { data: hw }, { data: sp }, { data: risk }] = await Promise.all([
      supabase.from('student_topic_performance').select('*, topics(name), subjects(name, color)').eq('student_id', p.id).order('accuracy_rate', { ascending: true }),
      supabase.from('homework_assignments').select('*, tests(name, chapters(name, books(name)))').eq('student_id', p.id).order('created_at', { ascending: false }),
      supabase.from('study_plans').select('*, study_plan_items(*, subjects(name), topics(name))').eq('student_id', p.id).eq('status', 'active').order('created_at', { ascending: false }).limit(1).single(),
      supabase.rpc('calculate_risk_score', { p_student_id: p.id }),
    ])

    setTopicPerf(tp ?? [])
    setHomework(hw ?? [])
    setStudyPlan(sp)
    setRiskScore(risk ?? 0)
    setLoading(false)
  }

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const totalQ = topicPerf.reduce((s, t) => s + t.total_questions, 0)
  const totalC = topicPerf.reduce((s, t) => s + t.correct_count, 0)
  const overallRate = totalQ > 0 ? Math.round(totalC / totalQ * 100) : 0
  const pendingHw = homework.filter(h => h.status !== 'completed').length
  const completedHw = homework.filter(h => h.status === 'completed').length
  const weakTopics = topicPerf.filter(t => t.accuracy_rate < 50)
  const strongTopics = topicPerf.filter(t => t.accuracy_rate >= 70)

  const DAYS = ['', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']

  function getRiskLabel(score: number) {
    if (score >= 70) return { label: 'Kritik', color: '#C0392B', bg: '#FEF2F2' }
    if (score >= 45) return { label: 'Yüksek', color: '#B45309', bg: '#FDF4E7' }
    if (score >= 20) return { label: 'Orta', color: '#1B3A6B', bg: '#EEF3FB' }
    return { label: 'İyi', color: '#2E7D52', bg: '#EAF4EE' }
  }

  function getMasteryColor(rate: number) {
    if (rate >= 70) return { bg: '#EAF4EE', text: '#2E7D52' }
    if (rate >= 50) return { bg: '#EEF3FB', text: '#1B3A6B' }
    if (rate >= 30) return { bg: '#FDF4E7', text: '#B45309' }
    return { bg: '#FEF2F2', text: '#C0392B' }
  }

  if (loading) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', color: '#7A8FA8', fontSize: '14px' }}>Yükleniyor...</div>

  const rl = getRiskLabel(riskScore)
  const TABS = [
    { id: 'dashboard', label: 'Ana Sayfa' },
    { id: 'performance', label: 'Performansım' },
    { id: 'homework', label: 'Ödevlerim' },
    { id: 'plan', label: 'Çalışma Planım' },
  ]

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#F0F4F9', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>

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
              <div style={{ fontSize: '10px', color: '#7A8FA8' }}>Öğrenci Paneli</div>
            </div>
          </div>
        </div>

        {profile && (
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #D5DFF0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#1B3A6B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {profile.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#1B3A6B' }}>{profile.full_name}</div>
                <div style={{ fontSize: '10px', padding: '1px 7px', borderRadius: '8px', background: rl.bg, color: rl.color, fontWeight: 600, display: 'inline-block', marginTop: '2px' }}>
                  Risk: {rl.label}
                </div>
              </div>
            </div>
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

        {/* ANA SAYFA */}
        {activeTab === 'dashboard' && (
          <div style={{ maxWidth: '900px' }}>
            <div style={{ marginBottom: '24px' }}>
              <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', margin: 0 }}>
                Merhaba, {profile?.full_name?.split(' ')[0]}!
              </h1>
              <p style={{ fontSize: '12px', color: '#7A8FA8', margin: '3px 0 0' }}>
                {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '24px' }}>
              {[
                { label: 'Genel Başarı', value: '%' + overallRate, color: overallRate >= 70 ? '#2E7D52' : overallRate >= 50 ? '#B45309' : '#C0392B', bg: overallRate >= 70 ? '#EAF4EE' : overallRate >= 50 ? '#FDF4E7' : '#FEF2F2' },
                { label: 'Risk Skoru', value: Math.round(riskScore), color: rl.color, bg: rl.bg },
                { label: 'Bekleyen Ödev', value: pendingHw, color: '#B45309', bg: '#FDF4E7' },
                { label: 'Çözülen Soru', value: totalQ, color: '#1B3A6B', bg: '#EEF3FB' },
              ].map(m => (
                <div key={m.label} style={{ background: m.bg, borderRadius: '10px', padding: '14px 16px' }}>
                  <div style={{ fontSize: '11px', color: m.color, fontWeight: 600, marginBottom: '4px' }}>{m.label}</div>
                  <div style={{ fontSize: '26px', fontWeight: 700, color: m.color }}>{m.value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {/* Zayıf Konular */}
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '18px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#C0392B', marginBottom: '12px' }}>
                  Öncelikli Konular ({weakTopics.length})
                </div>
                {weakTopics.length === 0 ? (
                  <div style={{ fontSize: '12.5px', color: '#2E7D52' }}>Kritik alan yok, harika!</div>
                ) : weakTopics.slice(0, 5).map(t => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 0', borderBottom: '1px solid #F0F4F9' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#C0392B', flexShrink: 0 }} />
                    <div style={{ flex: 1, fontSize: '12.5px', color: '#374151' }}>{t.subjects?.name} — {t.topics?.name}</div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#C0392B' }}>%{Math.round(t.accuracy_rate)}</span>
                  </div>
                ))}
              </div>

              {/* Güçlü Konular */}
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '18px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#2E7D52', marginBottom: '12px' }}>
                  Güçlü Konular ({strongTopics.length})
                </div>
                {strongTopics.length === 0 ? (
                  <div style={{ fontSize: '12.5px', color: '#7A8FA8' }}>Henüz yeterli veri yok</div>
                ) : strongTopics.slice(0, 5).map(t => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 0', borderBottom: '1px solid #F0F4F9' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2E7D52', flexShrink: 0 }} />
                    <div style={{ flex: 1, fontSize: '12.5px', color: '#374151' }}>{t.subjects?.name} — {t.topics?.name}</div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#2E7D52' }}>%{Math.round(t.accuracy_rate)}</span>
                  </div>
                ))}
              </div>

              {/* Son Ödevler */}
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '18px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '12px' }}>Son Ödevler</div>
                {homework.length === 0 ? (
                  <div style={{ fontSize: '12.5px', color: '#7A8FA8' }}>Henüz ödev yok</div>
                ) : homework.slice(0, 4).map((h, i) => (
                  <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 0', borderBottom: i < 3 ? '1px solid #F0F4F9' : 'none' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: h.status === 'completed' ? '#2E7D52' : '#B45309', flexShrink: 0 }} />
                    <div style={{ flex: 1, fontSize: '12.5px', color: '#374151' }}>{h.tests?.name}</div>
                    <span style={{ fontSize: '10.5px', fontWeight: 600, padding: '2px 7px', borderRadius: '8px', background: h.status === 'completed' ? '#EAF4EE' : '#FDF4E7', color: h.status === 'completed' ? '#2E7D52' : '#B45309' }}>
                      {h.status === 'completed' ? 'Tamam' : 'Bekliyor'}
                    </span>
                  </div>
                ))}
                <button onClick={() => setActiveTab('homework')} style={{ marginTop: '10px', fontSize: '12px', color: '#1B3A6B', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  Tümünü gör →
                </button>
              </div>

              {/* Bu Haftanın Planı */}
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '18px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '12px' }}>Bu Haftanın Planı</div>
                {!studyPlan ? (
                  <div style={{ fontSize: '12.5px', color: '#7A8FA8' }}>Henüz çalışma planı oluşturulmadı</div>
                ) : studyPlan.study_plan_items?.slice(0, 4).map((item: any, i: number) => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 0', borderBottom: i < 3 ? '1px solid #F0F4F9' : 'none' }}>
                    <div style={{ width: '28px', height: '20px', borderRadius: '4px', background: '#EEF3FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: '#1B3A6B', flexShrink: 0 }}>
                      {DAYS[item.day_of_week]?.slice(0, 3)}
                    </div>
                    <div style={{ flex: 1, fontSize: '12px', color: '#374151' }}>{item.subjects?.name} — {item.topics?.name}</div>
                    <span style={{ fontSize: '10.5px', color: '#7A8FA8' }}>{item.question_count}s</span>
                  </div>
                ))}
                {studyPlan && (
                  <button onClick={() => setActiveTab('plan')} style={{ marginTop: '10px', fontSize: '12px', color: '#1B3A6B', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    Planı gör →
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PERFORMANS */}
        {activeTab === 'performance' && (
          <div style={{ maxWidth: '900px' }}>
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', marginBottom: '20px' }}>Konu Performansım</h1>
            {topicPerf.length === 0 ? (
              <div style={{ background: '#FDF4E7', border: '1px solid #FED7AA', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
                <div style={{ fontSize: '14px', color: '#B45309' }}>Henüz soru çözüm verisi yok</div>
              </div>
            ) : (
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {topicPerf.map(t => {
                    const mc = getMasteryColor(t.accuracy_rate)
                    return (
                      <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', borderRadius: '8px', background: mc.bg }}>
                        <div style={{ width: '120px', flexShrink: 0 }}>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: mc.text }}>{t.topics?.name}</div>
                          <div style={{ fontSize: '10.5px', color: '#7A8FA8' }}>{t.subjects?.name}</div>
                        </div>
                        <div style={{ flex: 1, height: '8px', background: 'rgba(0,0,0,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: Math.min(t.accuracy_rate, 100) + '%', background: mc.text, borderRadius: '4px' }} />
                        </div>
                        <div style={{ width: '100px', display: 'flex', gap: '6px', fontSize: '11px', flexShrink: 0 }}>
                          <span style={{ color: '#2E7D52' }}>D:{t.correct_count}</span>
                          <span style={{ color: '#C0392B' }}>Y:{t.wrong_count}</span>
                          <span style={{ color: '#7A8FA8' }}>B:{t.blank_count}</span>
                        </div>
                        <div style={{ width: '44px', textAlign: 'right', flexShrink: 0 }}>
                          <span style={{ fontSize: '14px', fontWeight: 800, color: mc.text }}>%{Math.round(t.accuracy_rate)}</span>
                          {t.trend_direction === 'up' && <span style={{ fontSize: '11px', color: '#2E7D52' }}> ↑</span>}
                          {t.trend_direction === 'down' && <span style={{ fontSize: '11px', color: '#C0392B' }}> ↓</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ÖDEVLERİM */}
        {activeTab === 'homework' && (
          <div style={{ maxWidth: '900px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', margin: 0 }}>Ödevlerim</h1>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '8px', background: '#FDF4E7', color: '#B45309', fontWeight: 600 }}>Bekleyen: {pendingHw}</span>
                <span style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '8px', background: '#EAF4EE', color: '#2E7D52', fontWeight: 600 }}>Tamamlanan: {completedHw}</span>
              </div>
            </div>
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
              {homework.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#7A8FA8' }}>Henüz ödev yok</div>
              ) : homework.map((h, i) => {
                const isDone = h.status === 'completed'
                const isLate = !isDone && h.deadline && new Date(h.deadline) < new Date()
                return (
                  <a key={h.id} href={`/homework/${h.id}`} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px', borderBottom: i < homework.length - 1 ? '1px solid #F0F4F9' : 'none', textDecoration: 'none', background: isDone ? '#FAFFFE' : 'white' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '9px', background: isDone ? '#EAF4EE' : '#EEF3FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: isDone ? '#2E7D52' : '#1B3A6B', flexShrink: 0 }}>
                      {isDone ? '✓' : h.tests?.name?.slice(0, 3)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#1B3A6B', textDecoration: isDone ? 'line-through' : 'none' }}>{h.tests?.name}</div>
                      <div style={{ fontSize: '11.5px', color: '#7A8FA8' }}>{h.tests?.chapters?.books?.name}</div>
                    </div>
                    <span style={{ fontSize: '11.5px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', background: isDone ? '#EAF4EE' : isLate ? '#FEF2F2' : '#FDF4E7', color: isDone ? '#2E7D52' : isLate ? '#C0392B' : '#B45309' }}>
                      {isDone ? 'Tamamlandı' : isLate ? 'Gecikti' : 'Bekliyor'}
                    </span>
                  </a>
                )
              })}
            </div>
          </div>
        )}

        {/* ÇALIŞMA PLANI */}
        {activeTab === 'plan' && (
          <div style={{ maxWidth: '900px' }}>
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', marginBottom: '20px' }}>Haftalık Çalışma Planım</h1>
            {!studyPlan ? (
              <div style={{ background: '#FDF4E7', border: '1px solid #FED7AA', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
                <div style={{ fontSize: '14px', color: '#B45309', marginBottom: '8px' }}>Henüz çalışma planı oluşturulmadı</div>
                <div style={{ fontSize: '12.5px', color: '#7A8FA8' }}>Öğretmeninizden çalışma planı oluşturmasını isteyin</div>
              </div>
            ) : (
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #D5DFF0', fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>
                  {new Date(studyPlan.week_start_date).toLocaleDateString('tr-TR')} — {new Date(studyPlan.week_end_date).toLocaleDateString('tr-TR')}
                </div>
                {[1,2,3,4,5,6,7].map(day => {
                  const dayItems = studyPlan.study_plan_items?.filter((i: any) => i.day_of_week === day) ?? []
                  if (dayItems.length === 0) return null
                  return (
                    <div key={day} style={{ borderBottom: '1px solid #F0F4F9' }}>
                      <div style={{ padding: '10px 18px', background: '#F8FAFF', fontSize: '12px', fontWeight: 700, color: '#1B3A6B', borderBottom: '1px solid #F0F4F9' }}>
                        {DAYS[day]}
                        <span style={{ marginLeft: '8px', fontSize: '11px', color: '#7A8FA8', fontWeight: 400 }}>
                          {dayItems.reduce((s: number, i: any) => s + i.target_duration_minutes, 0)} dk
                        </span>
                      </div>
                      {dayItems.map((item: any, ti: number) => (
                        <div key={item.id} style={{ padding: '11px 18px', borderBottom: ti < dayItems.length - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.task_type === 'weak_area' ? '#C0392B' : item.task_type === 'review' ? '#B45309' : '#1B3A6B', flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#1B3A6B' }}>{item.subjects?.name} — {item.topics?.name}</div>
                            <div style={{ fontSize: '12px', color: '#4A6080' }}>{item.task_description}</div>
                          </div>
                          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '8px', background: '#F0F4F9', color: '#4A6080' }}>{item.question_count} soru</span>
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '8px', background: '#F0F4F9', color: '#4A6080' }}>{item.target_duration_minutes} dk</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}