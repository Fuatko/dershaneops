'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ParentReportPage() {
  const [students, setStudents] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [topicPerf, setTopicPerf] = useState<any[]>([])
  const [lessons, setLessons] = useState<any[]>([])
  const [homework, setHomework] = useState<any[]>([])
  const [riskScore, setRiskScore] = useState(0)
  const [report, setReport] = useState('')
  const [generating, setGenerating] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('profiles').select('id, full_name').eq('role', 'student').order('full_name')
    setStudents(data ?? [])
    setLoading(false)
  }

  async function selectStudent(s: any) {
    setSelected(s)
    setReport('')

    const [{ data: tp }, { data: l }, { data: hw }, { data: risk }] = await Promise.all([
      supabase.from('student_topic_performance').select('*, topics(name), subjects(name, color)').eq('student_id', s.id).order('accuracy_rate', { ascending: true }),
      supabase.from('lessons').select('*').eq('student_id', s.id).order('scheduled_at', { ascending: false }).limit(10),
      supabase.from('homework_assignments').select('*, tests(name, chapters(name, books(name)))').eq('student_id', s.id),
      supabase.rpc('calculate_risk_score', { p_student_id: s.id }),
    ])

    setTopicPerf(tp ?? [])
    setLessons(l ?? [])
    setHomework(hw ?? [])
    setRiskScore(risk ?? 0)
  }

  async function generateReport() {
    if (!selected) return
    setGenerating(true)
    setReport('')

    const totalQ = topicPerf.reduce((s, t) => s + t.total_questions, 0)
    const totalC = topicPerf.reduce((s, t) => s + t.correct_count, 0)
    const overallRate = totalQ > 0 ? Math.round(totalC / totalQ * 100) : 0
    const strongTopics = topicPerf.filter(t => t.accuracy_rate >= 70).map(t => t.subjects?.name + ' - ' + t.topics?.name).join(', ')
    const weakTopics = topicPerf.filter(t => t.accuracy_rate < 50).map(t => t.subjects?.name + ' - ' + t.topics?.name + ' (%' + Math.round(t.accuracy_rate) + ')').join(', ')
    const completedHw = homework.filter(h => h.status === 'completed').length
    const totalHw = homework.length
    const completedLessons = lessons.filter(l => l.status === 'completed').length

    try {
      const res = await fetch('/api/ai/parentreport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_name: selected.full_name,
          overall_rate: overallRate,
          risk_score: Math.round(riskScore),
          strong_topics: strongTopics || 'Henüz veri yok',
          weak_topics: weakTopics || 'Henüz veri yok',
          total_questions: totalQ,
          completed_homework: completedHw,
          total_homework: totalHw,
          completed_lessons: completedLessons,
          total_lessons: lessons.length,
        })
      })
      const d = await res.json()
      setReport(d.report ?? '')
    } catch {
      setReport('Rapor oluşturulamadı.')
    }
    setGenerating(false)
  }

  function printReport() {
    window.print()
  }

  const totalQ = topicPerf.reduce((s, t) => s + t.total_questions, 0)
  const totalC = topicPerf.reduce((s, t) => s + t.correct_count, 0)
  const overallRate = totalQ > 0 ? Math.round(totalC / totalQ * 100) : 0
  const completedHw = homework.filter(h => h.status === 'completed').length

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#7A8FA8' }}>Yükleniyor...</div>

  return (
    <div style={{ padding: '28px', maxWidth: '1200px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', margin: 0 }}>Veli Raporu</h1>
        <p style={{ fontSize: '12px', color: '#7A8FA8', margin: '3px 0 0' }}>AI ile üretilen yorumlu öğrenci gelişim raporu</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '16px' }}>

        {/* Öğrenci Listesi */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #D5DFF0', fontSize: '12.5px', fontWeight: 700, color: '#1B3A6B' }}>
            Öğrenci Seç
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

        {/* Rapor Paneli */}
        {!selected ? (
          <div style={{ background: '#F8FAFF', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '14px', color: '#7A8FA8' }}>Sol panelden öğrenci seçin</div>
          </div>
        ) : (
          <div>
            {/* Hızlı Metrikler */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '16px' }}>
              {[
                { label: 'Genel Başarı', value: '%' + overallRate, color: overallRate >= 70 ? '#2E7D52' : overallRate >= 50 ? '#B45309' : '#C0392B', bg: overallRate >= 70 ? '#EAF4EE' : overallRate >= 50 ? '#FDF4E7' : '#FEF2F2' },
                { label: 'Risk Skoru', value: Math.round(riskScore), color: riskScore >= 70 ? '#C0392B' : riskScore >= 45 ? '#B45309' : '#2E7D52', bg: riskScore >= 70 ? '#FEF2F2' : riskScore >= 45 ? '#FDF4E7' : '#EAF4EE' },
                { label: 'Ödev Tamamlama', value: homework.length > 0 ? '%' + Math.round(completedHw / homework.length * 100) : '—', color: '#1B3A6B', bg: '#EEF3FB' },
                { label: 'Toplam Soru', value: totalQ, color: '#6B4FC8', bg: '#F0ECFB' },
              ].map(m => (
                <div key={m.label} style={{ background: m.bg, borderRadius: '10px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '10.5px', color: m.color, fontWeight: 600, marginBottom: '3px' }}>{m.label}</div>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: m.color }}>{m.value}</div>
                </div>
              ))}
            </div>

            {/* Aksiyon Butonları */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              <button onClick={generateReport} disabled={generating} style={{ flex: 1, padding: '11px', borderRadius: '9px', background: '#6B4FC8', color: '#fff', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                {generating ? 'Rapor Hazırlanıyor...' : 'AI ile Yorumlu Rapor Oluştur'}
              </button>
              {report && (
                <button onClick={printReport} style={{ padding: '11px 18px', borderRadius: '9px', background: '#1B3A6B', color: '#fff', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                  Yazdır / PDF
                </button>
              )}
            </div>

            {/* AI Raporu */}
            {report && (
              <div id="printable-report" style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '28px', marginBottom: '16px' }}>
                {/* Rapor Başlığı */}
                <div style={{ borderBottom: '2px solid #1B3A6B', paddingBottom: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#1B3A6B' }}>Öğrenci Gelişim Raporu</div>
                    <div style={{ fontSize: '14px', color: '#4A6080', marginTop: '4px' }}>{selected.full_name}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Rapor Tarihi</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#1B3A6B' }}>{new Date().toLocaleDateString('tr-TR')}</div>
                  </div>
                </div>

                {/* Özet Tablo */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '20px' }}>
                  {[
                    { label: 'Genel Başarı', value: '%' + overallRate },
                    { label: 'Çözülen Soru', value: totalQ },
                    { label: 'Tamamlanan Ödev', value: completedHw + '/' + homework.length },
                    { label: 'Risk Seviyesi', value: riskScore >= 70 ? 'Kritik' : riskScore >= 45 ? 'Yüksek' : riskScore >= 20 ? 'Orta' : 'Düşük' },
                  ].map(m => (
                    <div key={m.label} style={{ background: '#F8FAFF', borderRadius: '8px', padding: '10px 14px', border: '1px solid #E2EAF8' }}>
                      <div style={{ fontSize: '10.5px', color: '#7A8FA8', fontWeight: 600, marginBottom: '3px' }}>{m.label}</div>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B' }}>{m.value}</div>
                    </div>
                  ))}
                </div>

                {/* AI Yorumu */}
                <div style={{ fontSize: '14px', color: '#374151', lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>{report}</div>

                {/* Konu Haritası */}
                {topicPerf.length > 0 && (
                  <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #E2EAF8' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '12px' }}>Konu Bazlı Performans</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {topicPerf.slice(0, 8).map(t => (
                        <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '12px', color: '#374151', width: '200px', flexShrink: 0 }}>{t.subjects?.name} — {t.topics?.name}</span>
                          <div style={{ flex: 1, height: '8px', background: '#F0F4F9', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: Math.min(t.accuracy_rate, 100) + '%', background: t.accuracy_rate >= 70 ? '#2E7D52' : t.accuracy_rate >= 50 ? '#B45309' : '#C0392B', borderRadius: '4px' }} />
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: t.accuracy_rate >= 70 ? '#2E7D52' : t.accuracy_rate >= 50 ? '#B45309' : '#C0392B', width: '40px', textAlign: 'right' }}>%{Math.round(t.accuracy_rate)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #E2EAF8', fontSize: '11px', color: '#9CA3AF', textAlign: 'center' }}>
                  Bu rapor yapay zeka destekli analiz ile oluşturulmuştur • DershaneOPS
                </div>
              </div>
            )}

            {/* Konu Performans Özeti */}
            {!report && topicPerf.length > 0 && (
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '18px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '14px' }}>Konu Performansı</div>
                {topicPerf.map(t => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '7px 0', borderBottom: '1px solid #F0F4F9' }}>
                    <span style={{ fontSize: '12px', color: '#374151', flex: 1 }}>{t.subjects?.name} — {t.topics?.name}</span>
                    <div style={{ width: '100px', height: '6px', background: '#F0F4F9', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: Math.min(t.accuracy_rate, 100) + '%', background: t.accuracy_rate >= 70 ? '#2E7D52' : t.accuracy_rate >= 50 ? '#B45309' : '#C0392B', borderRadius: '3px' }} />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: t.accuracy_rate >= 70 ? '#2E7D52' : t.accuracy_rate >= 50 ? '#B45309' : '#C0392B', width: '40px', textAlign: 'right' }}>%{Math.round(t.accuracy_rate)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}