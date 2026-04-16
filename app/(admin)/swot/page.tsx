'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SwotPage() {
  const [students, setStudents] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [topicPerf, setTopicPerf] = useState<any[]>([])
  const [examResults, setExamResults] = useState<any[]>([])
  const [homework, setHomework] = useState<any[]>([])
  const [goals, setGoals] = useState<any[]>([])
  const [riskScore, setRiskScore] = useState(0)
  const [swot, setSwot] = useState<any>(null)
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
    setSwot(null)

    const [{ data: tp }, { data: er }, { data: hw }, { data: g }, { data: risk }] = await Promise.all([
      supabase.from('student_topic_performance').select('*, topics(name), subjects(name)').eq('student_id', s.id),
      supabase.from('exam_results').select('*, exams(name, exam_date), subjects(name)').eq('student_id', s.id).order('created_at', { ascending: true }),
      supabase.from('homework_assignments').select('status').eq('student_id', s.id),
      supabase.from('student_goals').select('*').eq('student_id', s.id).eq('status', 'active'),
      supabase.rpc('calculate_risk_score', { p_student_id: s.id }),
    ])

    setTopicPerf(tp ?? [])
    setExamResults(er ?? [])
    setHomework(hw ?? [])
    setGoals(g ?? [])
    setRiskScore(risk ?? 0)

    // Otomatik SWOT hesapla
    generateSwot(tp ?? [], er ?? [], hw ?? [], g ?? [], risk ?? 0)
  }

  function generateSwot(tp: any[], er: any[], hw: any[], g: any[], risk: number) {
    const totalQ = tp.reduce((s, t) => s + t.total_questions, 0)
    const totalC = tp.reduce((s, t) => s + t.correct_count, 0)
    const overallRate = totalQ > 0 ? Math.round(totalC / totalQ * 100) : 0
    const completedHw = hw.filter(h => h.status === 'completed').length
    const hwRate = hw.length > 0 ? Math.round(completedHw / hw.length * 100) : 0

    const examGroups: any = {}
    er.forEach(r => {
      if (!examGroups[r.exam_id]) examGroups[r.exam_id] = { totalNet: 0, date: r.exams?.exam_date }
      examGroups[r.exam_id].totalNet += r.net
    })
    const nets = Object.values(examGroups).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((e: any) => e.totalNet)
    const last3 = nets.slice(-3)
    const first3 = nets.slice(0, 3)
    const last3Avg = last3.length > 0 ? last3.reduce((a, b) => a + b, 0) / last3.length : 0
    const first3Avg = first3.length > 0 ? first3.reduce((a, b) => a + b, 0) / first3.length : 0
    const trend = last3Avg - first3Avg

    const strongTopics = tp.filter(t => t.accuracy_rate >= 70)
    const weakTopics = tp.filter(t => t.accuracy_rate < 50)
    const midTopics = tp.filter(t => t.accuracy_rate >= 50 && t.accuracy_rate < 70)

    // Güçlü yönler
    const strengths: string[] = []
    if (strongTopics.length > 0) strengths.push(`${strongTopics.map(t => (t.subjects?.name ?? '') + ' — ' + (t.topics?.name ?? 'Genel')).slice(0, 3).join(', ')} konularında güçlü hakimiyet`)
    if (overallRate >= 70) strengths.push(`Genel başarı oranı yüksek: %${overallRate}`)
    if (hwRate >= 80) strengths.push(`Ödev tamamlama disiplini güçlü: %${hwRate}`)
    if (trend > 3) strengths.push(`Sınav performansı yükseliş trendinde (+${Math.round(trend)} net)`)
    if (nets.length >= 5) strengths.push(`${nets.length} sınav deneyimi kazanılmış`)
    if (strengths.length === 0) strengths.push('Henüz yeterli veri bulunmuyor')

    // Gelişim alanları
    const improvements: string[] = []
    if (weakTopics.length > 0) improvements.push(`${weakTopics.map(t => (t.subjects?.name ?? '') + ' — ' + (t.topics?.name ?? 'Genel')).slice(0, 3).join(', ')} konularında hakimiyet yetersiz`)
    if (overallRate < 50) improvements.push(`Genel başarı oranı düşük: %${overallRate} — sistematik tekrar gerekli`)
    if (hwRate < 60) improvements.push(`Ödev tamamlama oranı düşük: %${hwRate}`)
    if (trend < -3) improvements.push(`Sınav performansı düşüş trendinde (${Math.round(trend)} net)`)
    if (improvements.length === 0) improvements.push('Belirgin zayıflık alanı tespit edilmedi')

    // Fırsatlar
    const opportunities: string[] = []
    if (midTopics.length > 0) opportunities.push(`${midTopics.map(t => t.topics?.name ?? 'Genel').slice(0, 3).join(', ')} konuları orta seviyede — kısa çalışmayla hızlı gelişim potansiyeli`)
    if (g.length > 0) opportunities.push(`${g[0].target_exam} hedefi için ${g[0].target_score} puanla net hedef belirlendi`)
    if (hwRate >= 60 && hwRate < 80) opportunities.push('Ödev alışkanlığı orta düzeyde — düzenlilik artırılırsa hızlı ilerleme beklenir')
    if (nets.length > 0 && last3Avg > 0) opportunities.push(`Son sınav ortalaması ${Math.round(last3Avg)} — hedef puana yaklaşma potansiyeli var`)
    if (opportunities.length === 0) opportunities.push('Hedef belirlenerek fırsat alanları oluşturulabilir')

    // Riskler
    const risks: string[] = []
    if (risk >= 70) risks.push(`Risk skoru kritik seviyede: ${Math.round(risk)}/100 — acil müdahale gerekli`)
    else if (risk >= 45) risks.push(`Risk skoru yüksek: ${Math.round(risk)}/100 — yakın takip gerekli`)
    if (weakTopics.length >= 3) risks.push(`${weakTopics.length} konuda hakimiyet %50 altında — sınav performansını olumsuz etkiler`)
    if (trend < -5) risks.push('Sınav performansı belirgin düşüş gösteriyor — motivasyon ve çalışma düzeni kontrol edilmeli')
    if (hwRate < 40) risks.push('Ödev tamamlama oranı kritik düzeyde düşük')
    if (g.length === 0) risks.push('Hedef belirlenmemiş — motivasyon kaybı riski')
    if (risks.length === 0) risks.push('Belirgin risk faktörü tespit edilmedi')

    setSwot({ strengths, improvements, opportunities, risks, overallRate, hwRate, trend: Math.round(trend), riskVal: Math.round(risk) })
  }

  async function getAiSwot() {
    if (!selected || !swot) return
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/swot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_name: selected.full_name,
          overall_rate: swot.overallRate,
          risk_score: swot.riskVal,
          hw_rate: swot.hwRate,
          trend: swot.trend,
          strengths: swot.strengths.join('; '),
          improvements: swot.improvements.join('; '),
          opportunities: swot.opportunities.join('; '),
          risks: swot.risks.join('; '),
        })
      })
      const d = await res.json()
      if (d.swot) setSwot((prev: any) => ({ ...prev, aiComment: d.swot }))
    } catch { }
    setAiLoading(false)
  }

  function printSwot() {
    if (!swot || !selected) return
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<title>${selected.full_name} — SWOT Analizi</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Noto Sans',Arial,sans-serif;background:#f0f4f9;color:#1B3A6B}
  @media print{body{background:#fff}.no-print{display:none}@page{margin:0;size:A4}{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  .page{width:210mm;min-height:297mm;margin:0 auto;background:#fff}
  .header{background:#1B3A6B;padding:20px 28px;display:flex;justify-content:space-between;align-items:center}
  .header h1{font-size:20px;font-weight:800;color:#fff}
  .header p{font-size:11px;color:rgba(255,255,255,0.7);margin-top:2px}
  .header .date{font-size:11px;color:rgba(255,255,255,0.6)}
  .content{padding:24px 28px}
  .student{font-size:22px;font-weight:800;margin-bottom:4px}
  .sub{font-size:11px;color:#7A8FA8;margin-bottom:20px}
  .metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:24px}
  .metric{background:#F0F4F9;border-radius:8px;padding:12px;text-align:center}
  .metric .v{font-size:22px;font-weight:800}
  .metric .l{font-size:9px;color:#7A8FA8;margin-top:2px;text-transform:uppercase;letter-spacing:0.5px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px}
  .box{border-radius:10px;padding:16px;page-break-inside:avoid}
  .box-title{font-size:13px;font-weight:800;margin-bottom:10px;display:flex;align-items:center;gap:6px}
  .item{font-size:11.5px;padding:5px 0;border-bottom:1px solid rgba(0,0,0,0.06);line-height:1.5}
  .item:last-child{border-bottom:none}
  .ai-box{background:#F0ECFB;border:1px solid #C4B5FD;border-radius:10px;padding:16px;margin-top:16px}
  .ai-title{font-size:13px;font-weight:700;color:#6B4FC8;margin-bottom:8px}
  .ai-content{font-size:12px;color:#374151;line-height:1.8;white-space:pre-wrap}
  .footer{background:#1B3A6B;padding:10px 28px;display:flex;justify-content:space-between;font-size:9px;color:rgba(255,255,255,0.6)}
  .no-print{position:fixed;top:16px;right:16px;display:flex;gap:8px}
  .no-print button{padding:10px 18px;border:none;border-radius:8px;font-family:'Noto Sans',sans-serif;font-size:13px;font-weight:700;cursor:pointer}
  .btn-p{background:#1B3A6B;color:#fff}
  .btn-c{background:#f0f4f9;color:#1B3A6B;border:1px solid #D5DFF0 !important}
</style>
</head>
<body>
<div class="no-print">
  <button class="btn-p" onclick="window.print()">🖨️ Yazdır / PDF</button>
  <button class="btn-c" onclick="window.close()">✕ Kapat</button>
</div>
<div class="page">
  <div class="header">
    <div><h1>DershaneOPS</h1><p>Akademik SWOT Analizi</p></div>
    <div class="date">${new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
  </div>
  <div class="content">
    <div class="student">${selected.full_name}</div>
    <div class="sub">SWOT Analiz Raporu • ${new Date().toLocaleString('tr-TR')}</div>
    <div class="metrics">
      <div class="metric"><div class="v" style="color:${swot.overallRate >= 70 ? '#2E7D52' : swot.overallRate >= 50 ? '#B45309' : '#C0392B'}">%${swot.overallRate}</div><div class="l">Genel Başarı</div></div>
      <div class="metric"><div class="v" style="color:${swot.riskVal >= 70 ? '#C0392B' : swot.riskVal >= 45 ? '#B45309' : '#2E7D52'}">${swot.riskVal}/100</div><div class="l">Risk Skoru</div></div>
      <div class="metric"><div class="v">%${swot.hwRate}</div><div class="l">Ödev Tamamlama</div></div>
      <div class="metric"><div class="v" style="color:${swot.trend > 0 ? '#2E7D52' : swot.trend < 0 ? '#C0392B' : '#1B3A6B'}">${swot.trend > 0 ? '+' : ''}${swot.trend}</div><div class="l">Sınav Trendi</div></div>
    </div>
    <div class="grid">
      <div class="box" style="background:#EAF4EE;border:1px solid #D1FAE5">
        <div class="box-title" style="color:#2E7D52">💪 Güçlü Yönler</div>
        ${swot.strengths.map((s: string) => `<div class="item">${s}</div>`).join('')}
      </div>
      <div class="box" style="background:#FEF2F2;border:1px solid #FEE2E2">
        <div class="box-title" style="color:#C0392B">📈 Gelişim Alanları</div>
        ${swot.improvements.map((s: string) => `<div class="item">${s}</div>`).join('')}
      </div>
      <div class="box" style="background:#FDF4E7;border:1px solid #FEF3C7">
        <div class="box-title" style="color:#B45309">🎯 Fırsatlar</div>
        ${swot.opportunities.map((s: string) => `<div class="item">${s}</div>`).join('')}
      </div>
      <div class="box" style="background:#EEF3FB;border:1px solid #BFDBFE">
        <div class="box-title" style="color:#1B3A6B">⚠️ Riskler</div>
        ${swot.risks.map((s: string) => `<div class="item">${s}</div>`).join('')}
      </div>
    </div>
    ${swot.aiComment ? `<div class="ai-box"><div class="ai-title">🤖 AI Akademik Yorum</div><div class="ai-content">${swot.aiComment}</div></div>` : ''}
  </div>
  <div class="footer">
    <span>DershaneOPS | dershaneops.vercel.app</span>
    <span>Gizli Belge — Sadece Yetkili Kullanıcılar İçin</span>
  </div>
</div>
</body>
</html>`)
    win.document.close()
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#7A8FA8' }}>Yükleniyor...</div>

  return (
    <div style={{ padding: '28px', maxWidth: '1200px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', margin: 0 }}>SWOT Analizi</h1>
        <p style={{ fontSize: '12px', color: '#7A8FA8', margin: '3px 0 0' }}>Güçlü yönler, gelişim alanları, fırsatlar ve riskler</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '16px' }}>

        {/* Öğrenci Listesi */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden', alignSelf: 'flex-start' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #D5DFF0', fontSize: '12.5px', fontWeight: 700, color: '#1B3A6B' }}>
            Öğrenci Seç
          </div>
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
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>📊</div>
            <div style={{ fontSize: '14px', color: '#7A8FA8' }}>Analiz için öğrenci seçin</div>
          </div>
        ) : !swot ? (
          <div style={{ background: '#FDF4E7', borderRadius: '12px', border: '1px solid #FED7AA', padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '14px', color: '#B45309' }}>Yeterli veri yok</div>
          </div>
        ) : (
          <div>
            {/* Metrikler */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '16px' }}>
              {[
                { label: 'Genel Başarı', value: '%' + swot.overallRate, color: swot.overallRate >= 70 ? '#2E7D52' : swot.overallRate >= 50 ? '#B45309' : '#C0392B', bg: swot.overallRate >= 70 ? '#EAF4EE' : swot.overallRate >= 50 ? '#FDF4E7' : '#FEF2F2' },
                { label: 'Risk Skoru', value: swot.riskVal + '/100', color: swot.riskVal >= 70 ? '#C0392B' : swot.riskVal >= 45 ? '#B45309' : '#2E7D52', bg: swot.riskVal >= 70 ? '#FEF2F2' : swot.riskVal >= 45 ? '#FDF4E7' : '#EAF4EE' },
                { label: 'Ödev Tamamlama', value: '%' + swot.hwRate, color: '#6B4FC8', bg: '#F0ECFB' },
                { label: 'Sınav Trendi', value: (swot.trend > 0 ? '+' : '') + swot.trend, color: swot.trend > 0 ? '#2E7D52' : swot.trend < 0 ? '#C0392B' : '#1B3A6B', bg: swot.trend > 0 ? '#EAF4EE' : swot.trend < 0 ? '#FEF2F2' : '#EEF3FB' },
              ].map(m => (
                <div key={m.label} style={{ background: m.bg, borderRadius: '10px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '11px', color: m.color, fontWeight: 600, marginBottom: '3px' }}>{m.label}</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: m.color }}>{m.value}</div>
                </div>
              ))}
            </div>

            {/* SWOT Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              {[
                { title: '💪 Güçlü Yönler', items: swot.strengths, color: '#2E7D52', bg: '#EAF4EE', border: '#D1FAE5' },
                { title: '📈 Gelişim Alanları', items: swot.improvements, color: '#C0392B', bg: '#FEF2F2', border: '#FEE2E2' },
                { title: '🎯 Fırsatlar', items: swot.opportunities, color: '#B45309', bg: '#FDF4E7', border: '#FEF3C7' },
                { title: '⚠️ Riskler', items: swot.risks, color: '#1B3A6B', bg: '#EEF3FB', border: '#BFDBFE' },
              ].map(box => (
                <div key={box.title} style={{ background: box.bg, border: '1px solid ' + box.border, borderRadius: '12px', padding: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: box.color, marginBottom: '12px' }}>{box.title}</div>
                  {box.items.map((item: string, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', padding: '6px 0', borderBottom: i < box.items.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: box.color, flexShrink: 0, marginTop: '6px' }} />
                      <div style={{ fontSize: '12.5px', color: '#374151', lineHeight: 1.5 }}>{item}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* AI Yorum */}
            <div style={{ background: '#F0ECFB', border: '1px solid #C4B5FD', borderRadius: '12px', padding: '18px', marginBottom: '14px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#6B4FC8', marginBottom: '10px' }}>🤖 AI Akademik Yorum</div>
              {swot.aiComment ? (
                <div style={{ fontSize: '13px', color: '#374151', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{swot.aiComment}</div>
              ) : (
                <button onClick={getAiSwot} disabled={aiLoading} style={{ padding: '9px 18px', borderRadius: '8px', background: '#6B4FC8', color: '#fff', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                  {aiLoading ? 'AI Analiz Yapıyor...' : 'AI ile Derinlemesine Analiz Yap'}
                </button>
              )}
            </div>

            {/* Aksiyon */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={printSwot} style={{ padding: '10px 20px', borderRadius: '9px', background: '#1B3A6B', color: '#fff', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                🖨️ PDF / Yazdır
              </button>
              <a href={`/profile?student_id=${selected.id}`} style={{ padding: '10px 20px', borderRadius: '9px', background: '#EEF3FB', color: '#1B3A6B', fontSize: '13px', fontWeight: 600, border: '1px solid #BFDBFE', textDecoration: 'none' }}>
                📋 Gelişim Profili →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}