'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function PredictionPage() {
  const [students, setStudents] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [topicPerf, setTopicPerf] = useState<any[]>([])
  const [examResults, setExamResults] = useState<any[]>([])
  const [goals, setGoals] = useState<any[]>([])
  const [riskScore, setRiskScore] = useState(0)
  const [prediction, setPrediction] = useState<any>(null)
  const [aiPrediction, setAiPrediction] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
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
    setPrediction(null)
    setAiPrediction('')

    const [{ data: tp }, { data: er }, { data: g }, { data: risk }] = await Promise.all([
      supabase.from('student_topic_performance').select('*, subjects(name)').eq('student_id', s.id),
      supabase.from('exam_results').select('*, exams(exam_date)').eq('student_id', s.id).order('created_at', { ascending: true }),
      supabase.from('student_goals').select('*').eq('student_id', s.id).eq('status', 'active'),
      supabase.rpc('calculate_risk_score', { p_student_id: s.id }),
    ])

    setTopicPerf(tp ?? [])
    setExamResults(er ?? [])
    setGoals(g ?? [])
    setRiskScore(risk ?? 0)

    // Tahmin hesapla
    calculatePrediction(tp ?? [], er ?? [], g ?? [], risk ?? 0)
  }

  function calculatePrediction(tp: any[], er: any[], g: any[], risk: number) {
    // Genel başarı oranı
    const totalQ = tp.reduce((s, t) => s + t.total_questions, 0)
    const totalC = tp.reduce((s, t) => s + t.correct_count, 0)
    const overallRate = totalQ > 0 ? Math.round(totalC / totalQ * 100) : 0

    // Sınav trendi
    const examGroups: any = {}
    er.forEach(r => {
      if (!examGroups[r.exam_id]) examGroups[r.exam_id] = { totalNet: 0, date: r.exams?.exam_date }
      examGroups[r.exam_id].totalNet += r.net
    })
    const examNets = Object.values(examGroups).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((e: any) => e.totalNet)
    const last3 = examNets.slice(-3)
    const avg3 = last3.length > 0 ? last3.reduce((a, b) => a + b, 0) / last3.length : 0

    // Trend hesapla
    let trendScore = 0
    if (examNets.length >= 2) {
      const first = examNets.slice(0, Math.floor(examNets.length / 2))
      const second = examNets.slice(Math.floor(examNets.length / 2))
      const firstAvg = first.reduce((a, b) => a + b, 0) / first.length
      const secondAvg = second.reduce((a, b) => a + b, 0) / second.length
      trendScore = secondAvg - firstAvg
    }

    // Beklenen gelişim (aylık)
    const improvementRate = trendScore > 0 ? Math.min(trendScore / examNets.length * 2, 5) : -1
    const expectedNext = avg3 + improvementRate
    const expected3Month = avg3 + improvementRate * 3
    const expected6Month = avg3 + improvementRate * 6

    // Hedef ulaşma olasılığı
    const goalProbabilities = g.map(goal => {
      const gap = goal.target_score - goal.current_score
      const monthsLeft = goal.target_date ? Math.max(Math.round((new Date(goal.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)), 1) : 12
      const needed = gap / monthsLeft
      const canAchieve = improvementRate >= needed * 0.7
      const prob = canAchieve ? Math.min(Math.round((improvementRate / needed) * 60 + 30), 95) : Math.max(Math.round(30 - (needed - improvementRate) * 5), 5)
      return { ...goal, probability: prob, months_left: monthsLeft, needed_monthly: Math.round(needed * 10) / 10 }
    })

    // Konu bazlı tahmin
    const subjectPredictions = tp.reduce((acc: any, t) => {
      const name = t.subjects?.name ?? 'Diğer'
      if (!acc[name]) acc[name] = { rates: [], name }
      acc[name].rates.push(t.accuracy_rate)
      return acc
    }, {})

    const subjectForecasts = Object.values(subjectPredictions).map((s: any) => {
      const avg = s.rates.reduce((a: number, b: number) => a + b, 0) / s.rates.length
      const projected = Math.min(avg + (risk < 30 ? 5 : risk < 60 ? 2 : -3), 100)
      return { name: s.name, current: Math.round(avg), projected: Math.round(projected) }
    })

    setPrediction({
      overallRate,
      avg3: Math.round(avg3 * 100) / 100,
      expectedNext: Math.round(expectedNext * 100) / 100,
      expected3Month: Math.round(expected3Month * 100) / 100,
      expected6Month: Math.round(expected6Month * 100) / 100,
      trendScore: Math.round(trendScore * 100) / 100,
      improvementRate: Math.round(improvementRate * 100) / 100,
      goalProbabilities,
      subjectForecasts,
      examCount: examNets.length,
    })
  }

  async function getAiPrediction() {
    if (!selected || !prediction) return
    setAiLoading(true)
    setAiPrediction('')
    try {
      const res = await fetch('/api/ai/prediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_name: selected.full_name,
          overall_rate: prediction.overallRate,
          risk_score: Math.round(riskScore),
          avg_net: prediction.avg3,
          expected_next: prediction.expectedNext,
          expected_3month: prediction.expected3Month,
          trend: prediction.trendScore > 0 ? 'yükseliyor' : prediction.trendScore < 0 ? 'düşüyor' : 'stabil',
          goal_probabilities: prediction.goalProbabilities.map((g: any) => g.target_exam + ': %' + g.probability).join(', '),
          subject_forecasts: prediction.subjectForecasts.map((s: any) => s.name + ' ' + s.current + '→' + s.projected).join(', '),
        })
      })
      const d = await res.json()
      setAiPrediction(d.prediction ?? '')
    } catch { setAiPrediction('AI tahmini alınamadı.') }
    setAiLoading(false)
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#7A8FA8' }}>Yükleniyor...</div>

  return (
    <div style={{ padding: '28px', maxWidth: '1200px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', margin: 0 }}>Tahmin Motoru</h1>
        <p style={{ fontSize: '12px', color: '#7A8FA8', margin: '3px 0 0' }}>Beklenen skor, hedef ulaşma olasılığı ve gelişim tahmini</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '16px' }}>
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden', alignSelf: 'flex-start' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #D5DFF0', fontSize: '12.5px', fontWeight: 700, color: '#1B3A6B' }}>Öğrenci Seç</div>
          {students.map(s => (
            <div key={s.id} onClick={() => selectStudent(s)} style={{ padding: '11px 16px', borderBottom: '1px solid #F0F4F9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', background: selected?.id === s.id ? '#F5F8FF' : '#fff', borderLeft: selected?.id === s.id ? '3px solid #1B3A6B' : '3px solid transparent' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: selected?.id === s.id ? '#1B3A6B' : '#E2EAF8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: selected?.id === s.id ? '#fff' : '#1B3A6B', flexShrink: 0 }}>
                {s.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </div>
              <span style={{ fontSize: '12.5px', fontWeight: selected?.id === s.id ? 700 : 500, color: '#1B3A6B' }}>{s.full_name}</span>
            </div>
          ))}
        </div>

        {!selected ? (
          <div style={{ background: '#F8FAFF', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '14px', color: '#7A8FA8' }}>Öğrenci seçin</div>
          </div>
        ) : !prediction ? (
          <div style={{ background: '#FDF4E7', border: '1px solid #FED7AA', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '14px', color: '#B45309' }}>Yeterli veri yok. Deneme sınavı sonuçları girilmeli.</div>
          </div>
        ) : (
          <div>
            {/* Net Tahminleri */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '16px' }}>
              {[
                { label: 'Son 3 Ortalama', value: prediction.avg3, sub: prediction.examCount + ' sınav', color: '#1B3A6B', bg: '#EEF3FB' },
                { label: 'Sonraki Sınav', value: prediction.expectedNext, sub: prediction.trendScore > 0 ? '↑ Yükseliyor' : prediction.trendScore < 0 ? '↓ Düşüyor' : '→ Stabil', color: prediction.trendScore > 0 ? '#2E7D52' : prediction.trendScore < 0 ? '#C0392B' : '#1B3A6B', bg: prediction.trendScore > 0 ? '#EAF4EE' : prediction.trendScore < 0 ? '#FEF2F2' : '#EEF3FB' },
                { label: '3 Ay Sonra', value: prediction.expected3Month, sub: 'Tahmini net', color: '#6B4FC8', bg: '#F0ECFB' },
                { label: '6 Ay Sonra', value: prediction.expected6Month, sub: 'Tahmini net', color: '#B45309', bg: '#FDF4E7' },
              ].map(m => (
                <div key={m.label} style={{ background: m.bg, borderRadius: '12px', padding: '14px 16px' }}>
                  <div style={{ fontSize: '11px', color: m.color, fontWeight: 600, marginBottom: '4px' }}>{m.label}</div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: m.color }}>{m.value}</div>
                  <div style={{ fontSize: '10.5px', color: '#7A8FA8', marginTop: '2px' }}>{m.sub}</div>
                </div>
              ))}
            </div>

            {/* Hedef Ulaşma Olasılığı */}
            {prediction.goalProbabilities.length > 0 && (
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '18px', marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '14px' }}>Hedef Ulaşma Olasılığı</div>
                {prediction.goalProbabilities.map((g: any) => {
                  const probColor = g.probability >= 70 ? '#2E7D52' : g.probability >= 40 ? '#B45309' : '#C0392B'
                  const probBg = g.probability >= 70 ? '#EAF4EE' : g.probability >= 40 ? '#FDF4E7' : '#FEF2F2'
                  return (
                    <div key={g.id} style={{ background: probBg, borderRadius: '10px', padding: '14px 16px', marginBottom: '10px', border: '1px solid rgba(0,0,0,0.06)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#1B3A6B' }}>{g.target_exam} — {g.target_score} puan</div>
                          <div style={{ fontSize: '12px', color: '#7A8FA8' }}>
                            {g.months_left} ay kaldı • Aylık {g.needed_monthly} puan artış gerekli
                          </div>
                        </div>
                        <div style={{ textAlign: 'center', flexShrink: 0 }}>
                          <div style={{ fontSize: '32px', fontWeight: 800, color: probColor }}>%{g.probability}</div>
                          <div style={{ fontSize: '10px', color: '#7A8FA8' }}>olasılık</div>
                        </div>
                      </div>
                      <div style={{ height: '8px', background: 'rgba(0,0,0,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: g.probability + '%', background: probColor, borderRadius: '4px', transition: 'width 0.5s' }} />
                      </div>
                      <div style={{ fontSize: '11.5px', color: probColor, fontWeight: 600, marginTop: '6px' }}>
                        {g.probability >= 70 ? '✓ Hedefe ulaşma yüksek ihtimalle mümkün' : g.probability >= 40 ? '⚠ Mevcut gidişle hedefe ulaşmak zor, ek çalışma gerekli' : '✗ Hedefe ulaşmak için ciddi müdahale gerekiyor'}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Ders Bazlı Projeksiyon */}
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '18px', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '14px' }}>Ders Bazlı Projeksiyon (3 Ay)</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {prediction.subjectForecasts.map((s: any) => {
                  const improved = s.projected > s.current
                  return (
                    <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '10px 12px', borderRadius: '8px', background: '#F8FAFF', border: '1px solid #E2EAF8' }}>
                      <div style={{ width: '80px', fontSize: '12.5px', fontWeight: 700, color: '#1B3A6B', flexShrink: 0 }}>{s.name}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '5px' }}>
                          <div style={{ height: '6px', width: s.current + '%', background: '#D5DFF0', borderRadius: '3px', transition: 'width 0.3s' }} />
                          <span style={{ fontSize: '10px', color: '#7A8FA8' }}>Mevcut %{s.current}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <div style={{ height: '6px', width: s.projected + '%', background: improved ? '#2E7D52' : '#C0392B', borderRadius: '3px', transition: 'width 0.3s' }} />
                          <span style={{ fontSize: '10px', color: improved ? '#2E7D52' : '#C0392B', fontWeight: 600 }}>Tahmini %{s.projected}</span>
                        </div>
                      </div>
                      <div style={{ flexShrink: 0, textAlign: 'center' }}>
                        <span style={{ fontSize: '16px', fontWeight: 800, color: improved ? '#2E7D52' : '#C0392B' }}>
                          {improved ? '+' : ''}{s.projected - s.current}
                        </span>
                        <div style={{ fontSize: '9px', color: '#7A8FA8' }}>puan fark</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* AI Tahmin */}
            <div style={{ background: '#F0ECFB', border: '1px solid #C4B5FD', borderRadius: '12px', padding: '18px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#6B4FC8', marginBottom: '8px' }}>AI Gelişim Tahmini</div>
              {aiPrediction ? (
                <div style={{ fontSize: '13.5px', color: '#374151', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{aiPrediction}</div>
              ) : (
                <button onClick={getAiPrediction} disabled={aiLoading} style={{ padding: '9px 18px', borderRadius: '8px', background: '#6B4FC8', color: '#fff', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                  {aiLoading ? 'AI Hesaplıyor...' : 'AI ile Gelişim Tahmini Yap'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}