'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function PerformancePage() {
  const [students, setStudents] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [selectedSubject, setSelectedSubject] = useState<any>(null)
  const [topicPerf, setTopicPerf] = useState<any[]>([])
  const [attempts, setAttempts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [aiInsight, setAiInsight] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('map')
  const supabase = createClient()

  useEffect(() => { loadBase() }, [])

  async function loadBase() {
    const { data: s } = await supabase.from('profiles').select('id, full_name').eq('role', 'student').order('full_name')
    const { data: sub } = await supabase.from('subjects').select('*').order('name')
    setStudents(s ?? [])
    setSubjects(sub ?? [])
    setLoading(false)
  }

  async function loadStudentData(studentId: string) {
    const { data: tp } = await supabase
      .from('student_topic_performance')
      .select('*, topics(name, order_no), subjects(name, color)')
      .eq('student_id', studentId)
      .order('accuracy_rate', { ascending: true })
    setTopicPerf(tp ?? [])
    setSelectedSubject(null)
    setAttempts([])
    setAiInsight('')
  }

  async function loadAttempts(studentId: string, subjectId: string) {
    const { data } = await supabase
      .from('student_question_attempts')
      .select('*, topics(name), subjects(name)')
      .eq('student_id', studentId)
      .eq('subject_id', subjectId)
      .order('attempt_date', { ascending: false })
    setAttempts(data ?? [])
  }

  async function selectStudent(s: any) {
    setSelectedStudent(s)
    await loadStudentData(s.id)
  }

  async function selectSubject(sub: any) {
    setSelectedSubject(sub)
    if (selectedStudent) await loadAttempts(selectedStudent.id, sub.id)
  }

  async function getAiInsight() {
    if (!selectedStudent) return
    setAiLoading(true)
    setAiInsight('')
    const weakTopics = topicPerf.filter(t => t.accuracy_rate < 50).map(t => t.topics?.name + ' (%' + t.accuracy_rate + ')').join(', ')
    const strongTopics = topicPerf.filter(t => t.accuracy_rate >= 70).map(t => t.topics?.name + ' (%' + t.accuracy_rate + ')').join(', ')
    const totalQ = topicPerf.reduce((s, t) => s + t.total_questions, 0)
    const totalC = topicPerf.reduce((s, t) => s + t.correct_count, 0)
    const overallRate = totalQ > 0 ? Math.round(totalC / totalQ * 100) : 0
    try {
      const res = await fetch('/api/ai/insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_name: selectedStudent.full_name, overall_rate: overallRate, weak_topics: weakTopics || 'Yok', strong_topics: strongTopics || 'Yok', total_questions: totalQ })
      })
      const d = await res.json()
      setAiInsight(d.insight ?? '')
    } catch { setAiInsight('AI analizi alinamadi.') }
    setAiLoading(false)
  }

  function getMasteryColor(score: number) {
    if (score >= 80) return { bg: '#EAF4EE', border: '#A7D9B8', text: '#2E7D52', label: 'Guclu' }
    if (score >= 60) return { bg: '#EEF3FB', border: '#BFDBFE', text: '#1B3A6B', label: 'Iyi' }
    if (score >= 40) return { bg: '#FDF4E7', border: '#FED7AA', text: '#B45309', label: 'Gelisecek' }
    return { bg: '#FEF2F2', border: '#FECACA', text: '#C0392B', label: 'Zayif' }
  }

  const subjectGroups = topicPerf.reduce((acc: any, t) => {
    const sName = t.subjects?.name ?? 'Diger'
    if (!acc[sName]) acc[sName] = { color: t.subjects?.color ?? '#1B3A6B', topics: [] }
    acc[sName].topics.push(t)
    return acc
  }, {})

  const totalQuestions = topicPerf.reduce((s, t) => s + t.total_questions, 0)
  const totalCorrect = topicPerf.reduce((s, t) => s + t.correct_count, 0)
  const totalWrong = topicPerf.reduce((s, t) => s + t.wrong_count, 0)
  const overallRate = totalQuestions > 0 ? Math.round(totalCorrect / totalQuestions * 100) : 0
  const weakCount = topicPerf.filter(t => t.accuracy_rate < 50).length
  const strongCount = topicPerf.filter(t => t.accuracy_rate >= 70).length

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#7A8FA8' }}>Yukleniyor...</div>

  return (
    <div style={{ padding: '28px', maxWidth: '1200px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', margin: 0 }}>Konu Hakimiyet Haritasi</h1>
        <p style={{ fontSize: '12px', color: '#7A8FA8', margin: '3px 0 0' }}>Ogrenci bazli konu performansi ve gelisim analizi</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '16px' }}>
        <div>
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #D5DFF0', fontSize: '12.5px', fontWeight: 700, color: '#1B3A6B' }}>Ogrenciler ({students.length})</div>
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {students.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', fontSize: '12px', color: '#7A8FA8' }}>Ogrenci yok</div>
              ) : students.map(s => (
                <div key={s.id} onClick={() => selectStudent(s)} style={{ padding: '11px 16px', borderBottom: '1px solid #F0F4F9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', background: selectedStudent?.id === s.id ? '#F5F8FF' : '#fff', borderLeft: selectedStudent?.id === s.id ? '3px solid #1B3A6B' : '3px solid transparent' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: selectedStudent?.id === s.id ? '#1B3A6B' : '#E2EAF8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: selectedStudent?.id === s.id ? '#fff' : '#1B3A6B', flexShrink: 0 }}>
                    {s.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                  </div>
                  <span style={{ fontSize: '12.5px', fontWeight: selectedStudent?.id === s.id ? 700 : 500, color: '#1B3A6B' }}>{s.full_name}</span>
                </div>
              ))}
            </div>
          </div>

          {selectedStudent && topicPerf.length > 0 && (
            <div style={{ marginTop: '12px', background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '14px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#1B3A6B', marginBottom: '10px' }}>Genel Ozet</div>
              {[
                { label: 'Toplam Soru', value: totalQuestions, color: '#1B3A6B' },
                { label: 'Dogru', value: totalCorrect, color: '#2E7D52' },
                { label: 'Yanlis', value: totalWrong, color: '#C0392B' },
                { label: 'Basari', value: '%' + overallRate, color: overallRate >= 70 ? '#2E7D52' : overallRate >= 50 ? '#B45309' : '#C0392B' },
                { label: 'Zayif Konu', value: weakCount, color: '#C0392B' },
                { label: 'Guclu Konu', value: strongCount, color: '#2E7D52' },
              ].map(m => (
                <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #F0F4F9', fontSize: '12px' }}>
                  <span style={{ color: '#7A8FA8' }}>{m.label}</span>
                  <span style={{ fontWeight: 700, color: m.color }}>{m.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          {!selectedStudent ? (
            <div style={{ background: '#F8FAFF', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '60px', textAlign: 'center' }}>
              <div style={{ fontSize: '14px', color: '#7A8FA8' }}>Sol panelden bir ogrenci secin</div>
            </div>
          ) : topicPerf.length === 0 ? (
            <div style={{ background: '#FDF4E7', border: '1px solid #FED7AA', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
              <div style={{ fontSize: '14px', color: '#B45309' }}>Henuz soru cozum verisi yok</div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: '#F0F4F9', borderRadius: '10px', padding: '4px' }}>
                {[{ id: 'map', label: 'Hakimiyet Haritasi' }, { id: 'trend', label: 'Soru Gecmisi' }, { id: 'ai', label: 'AI Analizi' }].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flex: 1, padding: '8px', borderRadius: '7px', border: 'none', cursor: 'pointer', background: activeTab === tab.id ? '#fff' : 'transparent', color: activeTab === tab.id ? '#1B3A6B' : '#7A8FA8', fontSize: '12.5px', fontWeight: activeTab === tab.id ? 700 : 500 }}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === 'map' && (
                <div>
                  {Object.entries(subjectGroups).map(([sName, sData]: [string, any]) => (
                    <div key={sName} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden', marginBottom: '14px' }}>
                      <div style={{ height: '4px', background: sData.color }} />
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid #F0F4F9', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>{sName}</span>
                        <span style={{ fontSize: '11.5px', color: '#7A8FA8' }}>{sData.topics.length} konu</span>
                      </div>
                      <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                        {sData.topics.map((t: any) => {
                          const mc = getMasteryColor(t.mastery_score)
                          const pct = Math.min(Math.round(t.accuracy_rate), 100)
                          return (
                            <div key={t.id} style={{ background: mc.bg, borderRadius: '10px', padding: '12px 14px', border: '1px solid ' + mc.border }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ fontSize: '12.5px', fontWeight: 700, color: mc.text }}>{t.topics?.name}</span>
                                <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '8px', background: 'rgba(255,255,255,0.7)', color: mc.text }}>{mc.label}</span>
                              </div>
                              <div style={{ height: '6px', background: 'rgba(0,0,0,0.08)', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
                                <div style={{ height: '100%', width: pct + '%', background: mc.text, borderRadius: '3px' }} />
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: mc.text, marginBottom: '6px' }}>
                                <span>%{pct}</span>
                                <span>{t.total_questions} soru</span>
                              </div>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '8px', background: '#EAF4EE', color: '#2E7D52' }}>D:{t.correct_count}</span>
                                <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '8px', background: '#FEF2F2', color: '#C0392B' }}>Y:{t.wrong_count}</span>
                                <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '8px', background: '#F0F4F9', color: '#4A6080' }}>B:{t.blank_count}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'trend' && (
                <div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                    {subjects.filter(s => topicPerf.some(t => t.subject_id === s.id)).map(s => (
                      <button key={s.id} onClick={() => selectSubject(s)} style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid', cursor: 'pointer', fontSize: '12px', fontWeight: 600, background: selectedSubject?.id === s.id ? s.color : '#fff', color: selectedSubject?.id === s.id ? '#fff' : '#4A6080', borderColor: selectedSubject?.id === s.id ? s.color : '#D5DFF0' }}>
                        {s.name}
                      </button>
                    ))}
                  </div>
                  {attempts.length === 0 ? (
                    <div style={{ background: '#F8FAFF', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '40px', textAlign: 'center', color: '#7A8FA8', fontSize: '13px' }}>Ders secin</div>
                  ) : (
                    <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
                      {attempts.map((a, i) => {
                        const rate = a.total_questions > 0 ? Math.round(a.correct_count / a.total_questions * 100) : 0
                        return (
                          <div key={a.id} style={{ padding: '12px 16px', borderBottom: i < attempts.length - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: rate >= 70 ? '#EAF4EE' : rate >= 50 ? '#FDF4E7' : '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800, color: rate >= 70 ? '#2E7D52' : rate >= 50 ? '#B45309' : '#C0392B', flexShrink: 0 }}>
                              %{rate}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: '#1B3A6B', marginBottom: '3px' }}>{a.topics?.name ?? 'Genel'} — {a.difficulty_level}</div>
                              <div style={{ display: 'flex', gap: '10px', fontSize: '11.5px' }}>
                                <span style={{ color: '#2E7D52' }}>D:{a.correct_count}</span>
                                <span style={{ color: '#C0392B' }}>Y:{a.wrong_count}</span>
                                <span style={{ color: '#7A8FA8' }}>B:{a.blank_count}</span>
                                <span style={{ color: '#7A8FA8' }}>T:{a.total_questions}</span>
                              </div>
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#9CA3AF' }}>{new Date(a.attempt_date).toLocaleDateString('tr-TR')}</div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'ai' && (
                <div>
                  <div style={{ background: '#F0ECFB', border: '1px solid #C4B5FD', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#6B4FC8', marginBottom: '8px' }}>AI Akademik Analiz</div>
                    <p style={{ fontSize: '12.5px', color: '#4A6080', margin: '0 0 14px', lineHeight: 1.6 }}>
                      {selectedStudent?.full_name} icin konu verilerine dayali AI analizi.
                    </p>
                    <button onClick={getAiInsight} disabled={aiLoading} style={{ padding: '9px 18px', borderRadius: '8px', background: '#6B4FC8', color: '#fff', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                      {aiLoading ? 'Analiz Yapiliyor...' : 'AI Analizi Baslat'}
                    </button>
                  </div>
                  {aiInsight && (
                    <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '20px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '12px' }}>Analiz Sonucu</div>
                      <div style={{ fontSize: '13.5px', color: '#374151', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{aiInsight}</div>
                    </div>
                  )}
                  <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '18px', marginTop: '14px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '12px' }}>Risk Alanlari</div>
                    {topicPerf.filter(t => t.accuracy_rate < 50).length === 0 ? (
                      <div style={{ fontSize: '12.5px', color: '#2E7D52' }}>Kritik risk alani yok!</div>
                    ) : topicPerf.filter(t => t.accuracy_rate < 50).map(t => (
                      <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid #F0F4F9' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#C0392B', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#1B3A6B' }}>{t.subjects?.name} — {t.topics?.name}</div>
                          <div style={{ fontSize: '11.5px', color: '#7A8FA8' }}>{t.total_questions} soru — %{Math.round(t.accuracy_rate)} basari</div>
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: '20px', background: '#FEF2F2', color: '#C0392B' }}>Risk</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}