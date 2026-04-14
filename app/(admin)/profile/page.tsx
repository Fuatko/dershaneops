'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ProfilePage() {
  const [students, setStudents] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [topicPerf, setTopicPerf] = useState<any[]>([])
  const [attempts, setAttempts] = useState<any[]>([])
  const [lessons, setLessons] = useState<any[]>([])
  const [homework, setHomework] = useState<any[]>([])
  const [riskScore, setRiskScore] = useState(0)
  const [profile, setProfile] = useState<any>(null)
  const [aiProfile, setAiProfile] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('profiles').select('*').eq('role', 'student').order('full_name')
    setStudents(data ?? [])
    setLoading(false)
  }

  async function selectStudent(s: any) {
    setSelected(s)
    setAiProfile('')

    const [{ data: tp }, { data: att }, { data: l }, { data: hw }, { data: risk }] = await Promise.all([
      supabase.from('student_topic_performance').select('*, topics(name), subjects(name, color)').eq('student_id', s.id).order('mastery_score', { ascending: false }),
      supabase.from('student_question_attempts').select('*, subjects(name), topics(name)').eq('student_id', s.id).order('attempt_date', { ascending: false }).limit(20),
      supabase.from('lessons').select('*').eq('student_id', s.id).order('scheduled_at', { ascending: false }),
      supabase.from('homework_assignments').select('*').eq('student_id', s.id),
      supabase.rpc('calculate_risk_score', { p_student_id: s.id }),
    ])

    setTopicPerf(tp ?? [])
    setAttempts(att ?? [])
    setLessons(l ?? [])
    setHomework(hw ?? [])
    setRiskScore(risk ?? 0)
    setProfile(s)
  }

  async function generateAiProfile() {
    if (!selected) return
    setAiLoading(true)
    setAiProfile('')

    const totalQ = topicPerf.reduce((s, t) => s + t.total_questions, 0)
    const totalC = topicPerf.reduce((s, t) => s + t.correct_count, 0)
    const overallRate = totalQ > 0 ? Math.round(totalC / totalQ * 100) : 0
    const strongTopics = topicPerf.filter(t => t.accuracy_rate >= 70).map(t => t.subjects?.name + '-' + t.topics?.name).join(', ')
    const weakTopics = topicPerf.filter(t => t.accuracy_rate < 50).map(t => t.subjects?.name + '-' + t.topics?.name + '(%' + Math.round(t.accuracy_rate) + ')').join(', ')
    const trendUp = topicPerf.filter(t => t.trend_direction === 'up').length
    const trendDown = topicPerf.filter(t => t.trend_direction === 'down').length
    const completedHw = homework.filter(h => h.status === 'completed').length
    const completedL = lessons.filter(l => l.status === 'completed').length

    try {
      const res = await fetch('/api/ai/devprofile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_name: selected.full_name,
          overall_rate: overallRate,
          risk_score: Math.round(riskScore),
          strong_topics: strongTopics || 'Yok',
          weak_topics: weakTopics || 'Yok',
          total_questions: totalQ,
          trend_up: trendUp,
          trend_down: trendDown,
          completed_homework: completedHw,
          total_homework: homework.length,
          completed_lessons: completedL,
          total_lessons: lessons.length,
        })
      })
      const d = await res.json()
      setAiProfile(d.profile ?? '')
    } catch {
      setAiProfile('Profil oluşturulamadı.')
    }
    setAiLoading(false)
  }

  const totalQ = topicPerf.reduce((s, t) => s + t.total_questions, 0)
  const totalC = topicPerf.reduce((s, t) => s + t.correct_count, 0)
  const totalW = topicPerf.reduce((s, t) => s + t.wrong_count, 0)
  const overallRate = totalQ > 0 ? Math.round(totalC / totalQ * 100) : 0
  const completedHw = homework.filter(h => h.status === 'completed').length
  const completedL = lessons.filter(l => l.status === 'completed').length

  function getRiskColor(score: number) {
    if (score >= 70) return '#C0392B'
    if (score >= 45) return '#B45309'
    if (score >= 20) return '#1B3A6B'
    return '#2E7D52'
  }

  function getMasteryBg(rate: number) {
    if (rate >= 80) return { bg: '#EAF4EE', text: '#2E7D52' }
    if (rate >= 60) return { bg: '#EEF3FB', text: '#1B3A6B' }
    if (rate >= 40) return { bg: '#FDF4E7', text: '#B45309' }
    return { bg: '#FEF2F2', text: '#C0392B' }
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#7A8FA8' }}>Yükleniyor...</div>

  return (
    <div style={{ padding: '28px', maxWidth: '1200px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', margin: 0 }}>Akademik Gelişim Profili</h1>
        <p style={{ fontSize: '12px', color: '#7A8FA8', margin: '3px 0 0' }}>Öğrenci bazlı kapsamlı akademik profil ve gelişim analizi</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '16px' }}>

        {/* Öğrenci Listesi */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden', alignSelf: 'flex-start' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #D5DFF0', fontSize: '12.5px', fontWeight: 700, color: '#1B3A6B' }}>
            Öğrenci Seç ({students.length})
          </div>
          {students.map(s => (
            <div key={s.id} onClick={() => selectStudent(s)} style={{ padding: '11px 16px', borderBottom: '1px solid #F0F4F9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', background: selected?.id === s.id ? '#F5F8FF' : '#fff', borderLeft: selected?.id === s.id ? '3px solid #1B3A6B' : '3px solid transparent' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: selected?.id === s.id ? '#1B3A6B' : '#E2EAF8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: selected?.id === s.id ? '#fff' : '#1B3A6B', flexShrink: 0 }}>
                {s.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </div>
              <span style={{ fontSize: '12.5px', fontWeight: selected?.id === s.id ? 700 : 500, color: '#1B3A6B' }}>{s.full_name}</span>
            </div>
          ))}
        </div>

        {/* Profil Paneli */}
        {!selected ? (
          <div style={{ background: '#F8FAFF', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '14px', color: '#7A8FA8' }}>Sol panelden öğrenci seçin</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Profil Başlık Kartı */}
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#1B3A6B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                  {selected.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#1B3A6B' }}>{selected.full_name}</div>
                  <div style={{ fontSize: '12px', color: '#7A8FA8', marginTop: '2px' }}>
                    Kayıt: {new Date(selected.created_at).toLocaleDateString('tr-TR')}
                  </div>
                </div>
                <button onClick={generateAiProfile} disabled={aiLoading} style={{ padding: '10px 18px', borderRadius: '9px', background: '#6B4FC8', color: '#fff', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                  {aiLoading ? 'AI Analiz Yapıyor...' : 'AI Profil Oluştur'}
                </button>
              </div>

              {/* Ana Metrikler */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: '10px' }}>
                {[
                  { label: 'Başarı', value: '%' + overallRate, color: overallRate >= 70 ? '#2E7D52' : overallRate >= 50 ? '#B45309' : '#C0392B', bg: overallRate >= 70 ? '#EAF4EE' : overallRate >= 50 ? '#FDF4E7' : '#FEF2F2' },
                  { label: 'Risk', value: Math.round(riskScore), color: getRiskColor(riskScore), bg: riskScore >= 70 ? '#FEF2F2' : riskScore >= 45 ? '#FDF4E7' : '#EAF4EE' },
                  { label: 'Soru', value: totalQ, color: '#1B3A6B', bg: '#EEF3FB' },
                  { label: 'Doğru', value: totalC, color: '#2E7D52', bg: '#EAF4EE' },
                  { label: 'Ödev', value: completedHw + '/' + homework.length, color: '#6B4FC8', bg: '#F0ECFB' },
                  { label: 'Ders', value: completedL + '/' + lessons.length, color: '#B45309', bg: '#FDF4E7' },
                ].map(m => (
                  <div key={m.label} style={{ background: m.bg, borderRadius: '10px', padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: m.color, fontWeight: 600, marginBottom: '3px' }}>{m.label}</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: m.color }}>{m.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Profil */}
            {aiProfile && (
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #C4B5FD', padding: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#F0ECFB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="#6B4FC8" strokeWidth="1.4"/><path d="M7 4v4M7 10v.5" stroke="#6B4FC8" strokeWidth="1.4" strokeLinecap="round"/></svg>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#6B4FC8' }}>AI Akademik Gelişim Profili</span>
                </div>
                <div style={{ fontSize: '13.5px', color: '#374151', lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>{aiProfile}</div>
              </div>
            )}

            {/* SWOT Grid */}
            {topicPerf.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  { title: 'Güçlü Yönler', items: topicPerf.filter(t => t.accuracy_rate >= 70), color: '#2E7D52', bg: '#EAF4EE', border: '#A7D9B8' },
                  { title: 'Gelişim Alanları', items: topicPerf.filter(t => t.accuracy_rate < 50), color: '#C0392B', bg: '#FEF2F2', border: '#FECACA' },
                  { title: 'Gelişim Fırsatları', items: topicPerf.filter(t => t.accuracy_rate >= 50 && t.accuracy_rate < 70), color: '#B45309', bg: '#FDF4E7', border: '#FED7AA' },
                  { title: 'Öncelikli Aksiyonlar', items: topicPerf.filter(t => t.accuracy_rate < 50).slice(0, 3), color: '#6B4FC8', bg: '#F0ECFB', border: '#C4B5FD' },
                ].map(box => (
                  <div key={box.title} style={{ background: box.bg, borderRadius: '12px', padding: '16px', border: '1px solid ' + box.border }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: box.color, marginBottom: '10px' }}>{box.title}</div>
                    {box.items.length === 0 ? (
                      <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Bu kategoride konu yok</div>
                    ) : box.items.slice(0, 4).map((t: any) => (
                      <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(0,0,0,0.05)', fontSize: '12px' }}>
                        <span style={{ color: box.color }}>{t.subjects?.name} — {t.topics?.name}</span>
                        <span style={{ fontWeight: 700, color: box.color }}>%{Math.round(t.accuracy_rate)}</span>
                      </div>
                    ))}
                    {box.title === 'Öncelikli Aksiyonlar' && box.items.length > 0 && (
                      <div style={{ marginTop: '8px', fontSize: '11.5px', color: box.color, lineHeight: 1.6 }}>
                        Bu konularda ek çalışma ve tekrar yapılması önerilir.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Konu Hakimiyet Haritası */}
            {topicPerf.length > 0 && (
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '18px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '14px' }}>Konu Hakimiyet Haritası</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {topicPerf.map(t => {
                    const mc = getMasteryBg(t.accuracy_rate)
                    return (
                      <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '180px', flexShrink: 0 }}>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: '#1B3A6B' }}>{t.topics?.name}</div>
                          <div style={{ fontSize: '10.5px', color: '#7A8FA8' }}>{t.subjects?.name} • {t.total_questions} soru</div>
                        </div>
                        <div style={{ flex: 1, height: '8px', background: '#F0F4F9', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: Math.min(t.accuracy_rate, 100) + '%', background: mc.text, borderRadius: '4px' }} />
                        </div>
                        <div style={{ width: '80px', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          <span style={{ fontSize: '13px', fontWeight: 800, color: mc.text }}>%{Math.round(t.accuracy_rate)}</span>
                          {t.trend_direction === 'up' && <span style={{ fontSize: '11px', color: '#2E7D52' }}>↑</span>}
                          {t.trend_direction === 'down' && <span style={{ fontSize: '11px', color: '#C0392B' }}>↓</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Son Çalışmalar */}
            {attempts.length > 0 && (
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #D5DFF0', fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>
                  Son Çalışmalar ({attempts.length})
                </div>
                {attempts.slice(0, 8).map((a, i) => {
                  const rate = a.total_questions > 0 ? Math.round(a.correct_count / a.total_questions * 100) : 0
                  return (
                    <div key={a.id} style={{ padding: '11px 18px', borderBottom: i < 7 ? '1px solid #F0F4F9' : 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '9px', background: rate >= 70 ? '#EAF4EE' : rate >= 50 ? '#FDF4E7' : '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: rate >= 70 ? '#2E7D52' : rate >= 50 ? '#B45309' : '#C0392B', flexShrink: 0 }}>
                        %{rate}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#1B3A6B' }}>
                          {a.subjects?.name}{a.topics?.name ? ' — ' + a.topics.name : ''}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#7A8FA8' }}>
                          D:{a.correct_count} Y:{a.wrong_count} B:{a.blank_count} • {new Date(a.attempt_date).toLocaleDateString('tr-TR')}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}