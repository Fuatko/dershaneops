'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

function getRiskLevel(score: number) {
  if (score >= 70) return { label: 'Kritik', color: '#C0392B', bg: '#FEF2F2', border: '#FECACA' }
  if (score >= 45) return { label: 'Yuksek', color: '#B45309', bg: '#FDF4E7', border: '#FED7AA' }
  if (score >= 20) return { label: 'Orta', color: '#1B3A6B', bg: '#EEF3FB', border: '#BFDBFE' }
  return { label: 'Dusuk', color: '#2E7D52', bg: '#EAF4EE', border: '#A7D9B8' }
}

export default function RiskPage() {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)
  const [topicPerf, setTopicPerf] = useState<any[]>([])
  const [aiInsight, setAiInsight] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'student')
      .order('full_name')

    const result = []
    for (const p of profiles ?? []) {
      const { data: riskData } = await supabase.rpc('calculate_risk_score', { p_student_id: p.id })
      const { data: tp } = await supabase
        .from('student_topic_performance')
        .select('accuracy_rate, total_questions')
        .eq('student_id', p.id)
      const totalQ = (tp ?? []).reduce((s: number, t: any) => s + t.total_questions, 0)
      const totalC = (tp ?? []).reduce((s: number, t: any) => s + (t.total_questions * t.accuracy_rate / 100), 0)
      const overallRate = totalQ > 0 ? Math.round(totalC / totalQ * 100) : 0
      const weakCount = (tp ?? []).filter((t: any) => t.accuracy_rate < 50).length
      result.push({ ...p, risk_score: riskData ?? 0, overall_rate: overallRate, total_questions: totalQ, weak_topics: weakCount, topic_count: (tp ?? []).length })
    }
    result.sort((a, b) => b.risk_score - a.risk_score)
    setStudents(result)
    setLoading(false)
  }

  async function selectStudent(s: any) {
    setSelected(s)
    setAiInsight('')
    const { data } = await supabase
      .from('student_topic_performance')
      .select('*, topics(name), subjects(name, color)')
      .eq('student_id', s.id)
      .order('accuracy_rate', { ascending: true })
    setTopicPerf(data ?? [])
  }

  async function getAiRiskInsight() {
    if (!selected) return
    setAiLoading(true)
    setAiInsight('')
    const weakTopics = topicPerf.filter(t => t.accuracy_rate < 50).map(t => t.subjects?.name + ' - ' + t.topics?.name + ' (%' + Math.round(t.accuracy_rate) + ')').join(', ')
    const strongTopics = topicPerf.filter(t => t.accuracy_rate >= 70).map(t => t.topics?.name).join(', ')
    try {
      const res = await fetch('/api/ai/insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_name: selected.full_name, overall_rate: selected.overall_rate, weak_topics: weakTopics || 'Yok', strong_topics: strongTopics || 'Yok', total_questions: selected.total_questions })
      })
      const d = await res.json()
      setAiInsight(d.insight ?? '')
    } catch {
      setAiInsight('AI analizi alinamadi.')
    }
    setAiLoading(false)
  }

  const kritik = students.filter(s => s.risk_score >= 70).length
  const yuksek = students.filter(s => s.risk_score >= 45 && s.risk_score < 70).length
  const orta = students.filter(s => s.risk_score >= 20 && s.risk_score < 45).length
  const dusuk = students.filter(s => s.risk_score < 20).length

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#7A8FA8' }}>Risk skorlari hesaplaniyor...</div>
  }

  return (
    <div style={{ padding: '28px', maxWidth: '1200px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', margin: 0 }}>Akademik Risk Analizi</h1>
        <p style={{ fontSize: '12px', color: '#7A8FA8', margin: '3px 0 0' }}>Ogrenci bazli risk skoru ve erken uyari sistemi</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '24px' }}>
        {[
          { label: 'Kritik Risk', value: kritik, color: '#C0392B', bg: '#FEF2F2' },
          { label: 'Yuksek Risk', value: yuksek, color: '#B45309', bg: '#FDF4E7' },
          { label: 'Orta Risk', value: orta, color: '#1B3A6B', bg: '#EEF3FB' },
          { label: 'Dusuk Risk', value: dusuk, color: '#2E7D52', bg: '#EAF4EE' },
        ].map(m => (
          <div key={m.label} style={{ background: m.bg, borderRadius: '10px', padding: '14px 16px' }}>
            <div style={{ fontSize: '11px', color: m.color, fontWeight: 600, marginBottom: '4px' }}>{m.label}</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '16px' }}>
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #D5DFF0', fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>
            Risk Siralaması — {students.length} ogrenci
          </div>
          {students.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#7A8FA8' }}>Henuz ogrenci verisi yok</div>
          ) : students.map((s, i) => {
            const rl = getRiskLevel(s.risk_score)
            return (
              <div key={s.id} onClick={() => selectStudent(s)} style={{ padding: '14px 18px', borderBottom: i < students.length - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', background: selected?.id === s.id ? '#F5F8FF' : '#fff', borderLeft: selected?.id === s.id ? '3px solid #1B3A6B' : '3px solid transparent' }}>
                <div style={{ width: '22px', fontSize: '12px', fontWeight: 700, color: '#9CA3AF', flexShrink: 0, textAlign: 'center' }}>{i + 1}</div>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: selected?.id === s.id ? '#1B3A6B' : '#E2EAF8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: selected?.id === s.id ? '#fff' : '#1B3A6B', flexShrink: 0 }}>
                  {s.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#1B3A6B', marginBottom: '2px' }}>{s.full_name}</div>
                  <div style={{ fontSize: '11.5px', color: '#7A8FA8' }}>{s.total_questions} soru • %{s.overall_rate} basari • {s.weak_topics} zayif konu</div>
                </div>
                <div style={{ textAlign: 'center', flexShrink: 0, minWidth: '60px' }}>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: rl.color }}>{Math.round(s.risk_score)}</div>
                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '10px', background: rl.bg, color: rl.color }}>{rl.label}</span>
                </div>
                <div style={{ width: '80px', flexShrink: 0 }}>
                  <div style={{ height: '6px', background: '#F0F4F9', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: Math.min(s.risk_score, 100) + '%', background: rl.color, borderRadius: '3px' }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {selected ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignSelf: 'flex-start', position: 'sticky', top: '20px' }}>
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
              <div style={{ height: '4px', background: getRiskLevel(selected.risk_score).color }} />
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#E2EAF8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: '#1B3A6B' }}>
                    {selected.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#1B3A6B' }}>{selected.full_name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                      <span style={{ fontSize: '22px', fontWeight: 800, color: getRiskLevel(selected.risk_score).color }}>{Math.round(selected.risk_score)}</span>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', background: getRiskLevel(selected.risk_score).bg, color: getRiskLevel(selected.risk_score).color }}>{getRiskLevel(selected.risk_score).label} Risk</span>
                    </div>
                  </div>
                </div>
                <div style={{ height: '8px', background: '#F0F4F9', borderRadius: '4px', overflow: 'hidden', marginBottom: '14px' }}>
                  <div style={{ height: '100%', width: Math.min(selected.risk_score, 100) + '%', background: getRiskLevel(selected.risk_score).color, borderRadius: '4px' }} />
                </div>
                {[
                  { label: 'Genel Basari', value: '%' + selected.overall_rate, color: selected.overall_rate >= 70 ? '#2E7D52' : selected.overall_rate >= 50 ? '#B45309' : '#C0392B' },
                  { label: 'Toplam Soru', value: selected.total_questions, color: '#1B3A6B' },
                  { label: 'Zayif Konu', value: selected.weak_topics, color: '#C0392B' },
                ].map(m => (
                  <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F0F4F9', fontSize: '12px' }}>
                    <span style={{ color: '#7A8FA8' }}>{m.label}</span>
                    <span style={{ fontWeight: 700, color: m.color }}>{m.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {topicPerf.filter(t => t.accuracy_rate < 50).length > 0 && (
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '14px' }}>
                <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#C0392B', marginBottom: '10px' }}>Risk Konulari</div>
                {topicPerf.filter(t => t.accuracy_rate < 50).map((t, i) => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0', borderBottom: '1px solid #F0F4F9', fontSize: '12px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#C0392B', flexShrink: 0 }} />
                    <span style={{ flex: 1, color: '#374151' }}>{t.subjects?.name} — {t.topics?.name}</span>
                    <span style={{ fontWeight: 700, color: '#C0392B' }}>%{Math.round(t.accuracy_rate)}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ background: '#F0ECFB', border: '1px solid #C4B5FD', borderRadius: '12px', padding: '14px' }}>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#6B4FC8', marginBottom: '8px' }}>AI Risk Degerlendirmesi</div>
              {aiInsight ? (
                <div style={{ fontSize: '12.5px', color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{aiInsight}</div>
              ) : (
                <button onClick={getAiRiskInsight} disabled={aiLoading} style={{ width: '100%', padding: '9px', borderRadius: '8px', background: '#6B4FC8', color: '#fff', fontSize: '12.5px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                  {aiLoading ? 'Analiz Yapiliyor...' : 'AI Risk Analizi Baslat'}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div style={{ background: '#F8FAFF', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '14px', color: '#7A8FA8' }}>Detay icin ogrenci secin</div>
          </div>
        )}
      </div>
    </div>
  )
}