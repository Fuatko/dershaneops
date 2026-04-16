'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function VeliRaporPage() {
  const [students, setStudents] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [topicPerf, setTopicPerf] = useState<any[]>([])
  const [homework, setHomework] = useState<any[]>([])
  const [lessons, setLessons] = useState<any[]>([])
  const [goals, setGoals] = useState<any[]>([])
  const [streak, setStreak] = useState<any>(null)
  const [riskScore, setRiskScore] = useState(0)
  const [aiReport, setAiReport] = useState('')
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
    setAiReport('')

    const [{ data: tp }, { data: hw }, { data: l }, { data: g }, { data: risk }, { data: st }] = await Promise.all([
      supabase.from('student_topic_performance').select('*, topics(name), subjects(name)').eq('student_id', s.id),
      supabase.from('homework_assignments').select('*, tests(name)').eq('student_id', s.id).order('created_at', { ascending: false }),
      supabase.from('lessons').select('*, profiles!lessons_teacher_id_fkey(full_name)').eq('student_id', s.id).order('scheduled_at', { ascending: false }).limit(10),
      supabase.from('student_goals').select('*').eq('student_id', s.id).eq('status', 'active'),
      supabase.rpc('calculate_risk_score', { p_student_id: s.id }),
      supabase.from('student_streaks').select('*').eq('student_id', s.id).single(),
    ])

    setTopicPerf(tp ?? [])
    setHomework(hw ?? [])
    setLessons(l ?? [])
    setGoals(g ?? [])
    setRiskScore(risk ?? 0)
    setStreak(st)
  }

  async function getAiReport() {
    if (!selected) return
    setAiLoading(true)
    setAiReport('')

    const totalQ = topicPerf.reduce((s, t) => s + t.total_questions, 0)
    const totalC = topicPerf.reduce((s, t) => s + t.correct_count, 0)
    const overallRate = totalQ > 0 ? Math.round(totalC / totalQ * 100) : 0
    const completedHw = homework.filter(h => h.status === 'completed').length
    const completedLessons = lessons.filter(l => l.status === 'completed').length
    const weakTopics = topicPerf.filter(t => t.accuracy_rate < 50).map(t => (t.subjects?.name ?? '') + ' — ' + (t.topics?.name ?? 'Genel')).slice(0, 3).join(', ')
    const strongTopics = topicPerf.filter(t => t.accuracy_rate >= 70).map(t => t.topics?.name ?? 'Genel').slice(0, 3).join(', ')

    try {
      const res = await fetch('/api/ai/parentreport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_name: selected.full_name,
          overall_rate: overallRate,
          risk_score: Math.round(riskScore),
          completed_hw: completedHw,
          total_hw: homework.length,
          completed_lessons: completedLessons,
          total_lessons: lessons.length,
          streak: streak?.current_streak ?? 0,
          weak_topics: weakTopics || 'Belirsiz',
          strong_topics: strongTopics || 'Belirsiz',
          goals: goals.map(g => g.target_exam + ' ' + g.target_score + ' puan').join(', ') || 'Hedef belirlenmemiş',
        })
      })
      const d = await res.json()
      setAiReport(d.report ?? '')
    } catch { setAiReport('AI raporu alınamadı.') }
    setAiLoading(false)
  }

  function printReport() {
    if (!selected) return
    const totalQ = topicPerf.reduce((s, t) => s + t.total_questions, 0)
    const totalC = topicPerf.reduce((s, t) => s + t.correct_count, 0)
    const overallRate = totalQ > 0 ? Math.round(totalC / totalQ * 100) : 0
    const completedHw = homework.filter(h => h.status === 'completed').length
    const completedLessons = lessons.filter(l => l.status === 'completed').length
    const riskVal = Math.round(riskScore)
    const riskColor = riskVal >= 70 ? '#C0392B' : riskVal >= 45 ? '#B45309' : '#2E7D52'
    const rateColor = overallRate >= 70 ? '#2E7D52' : overallRate >= 50 ? '#B45309' : '#C0392B'

    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<title>${selected.full_name} — Veli Raporu</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Noto Sans',Arial,sans-serif;background:#f0f4f9;color:#1B3A6B}
  @media print{body{background:#fff}.no-print{display:none}@page{margin:0;size:A4}{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  .page{width:210mm;min-height:297mm;margin:0 auto;background:#fff}
  .header{background:#1B3A6B;padding:22px 28px;display:flex;justify-content:space-between;align-items:center}
  .header h1{font-size:22px;font-weight:800;color:#fff}
  .header p{font-size:11px;color:rgba(255,255,255,0.7);margin-top:3px}
  .header .date{font-size:11px;color:rgba(255,255,255,0.6);text-align:right}
  .content{padding:24px 28px 60px}
  .student{font-size:22px;font-weight:800;margin-bottom:3px}
  .sub{font-size:11px;color:#7A8FA8;margin-bottom:20px}
  .metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:24px}
  .metric{border-radius:10px;padding:14px;text-align:center}
  .metric .v{font-size:22px;font-weight:800}
  .metric .l{font-size:9px;color:#7A8FA8;margin-top:3px;text-transform:uppercase;letter-spacing:0.5px}
  .sec-title{font-size:13px;font-weight:700;color:#fff;background:#1B3A6B;padding:8px 14px;border-radius:6px 6px 0 0}
  table{width:100%;border-collapse:collapse;font-size:11px}
  th{background:#2A4A8A;color:#fff;padding:9px 12px;text-align:left;font-weight:600}
  td{padding:8px 12px;border-bottom:1px solid #F0F4F9;color:#374151}
  tr:nth-child(even) td{background:#F8FAFF}
  .badge{display:inline-block;padding:3px 9px;border-radius:12px;font-size:10px;font-weight:700}
  .good{background:#EAF4EE;color:#2E7D52}
  .mid{background:#FDF4E7;color:#B45309}
  .bad{background:#FEF2F2;color:#C0392B}
  .ai-box{background:#EEF3FB;border:1px solid #BFDBFE;border-radius:10px;padding:18px;margin-top:20px}
  .ai-title{font-size:13px;font-weight:700;color:#1B3A6B;margin-bottom:10px}
  .ai-content{font-size:12.5px;color:#374151;line-height:1.9;white-space:pre-wrap}
  .footer{background:#1B3A6B;padding:10px 28px;display:flex;justify-content:space-between;font-size:9px;color:rgba(255,255,255,0.6);position:fixed;bottom:0;width:210mm}
  .no-print{position:fixed;top:16px;right:16px;display:flex;gap:8px}
  .no-print button{padding:10px 18px;border:none;border-radius:8px;font-family:'Noto Sans',sans-serif;font-size:13px;font-weight:700;cursor:pointer}
  .btn-p{background:#1B3A6B;color:#fff}
  .btn-c{background:#f0f4f9;color:#1B3A6B}
  .two-col{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px}
  .box{border-radius:10px;padding:16px}
  .box-title{font-size:12px;font-weight:800;margin-bottom:10px}
  .item{font-size:11px;padding:4px 0;border-bottom:1px solid rgba(0,0,0,0.05)}
</style>
</head>
<body>
<div class="no-print">
  <button class="btn-p" onclick="window.print()">🖨️ Yazdır / PDF</button>
  <button class="btn-c" onclick="window.close()">✕ Kapat</button>
</div>
<div class="page">
  <div class="header">
    <div>
      <h1>DershaneOPS</h1>
      <p>Veli Gelişim Raporu</p>
    </div>
    <div class="date">${new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
  </div>
  <div class="content">
    <div class="student">${selected.full_name}</div>
    <div class="sub">Sayın Veli, çocuğunuzun akademik gelişim raporunu aşağıda bulabilirsiniz.</div>

    <div class="metrics">
      <div class="metric" style="background:#F0F4F9">
        <div class="v" style="color:${rateColor}">%${overallRate}</div>
        <div class="l">Genel Başarı</div>
      </div>
      <div class="metric" style="background:#F0F4F9">
        <div class="v" style="color:${riskColor}">${riskVal}/100</div>
        <div class="l">Risk Skoru</div>
      </div>
      <div class="metric" style="background:#F0F4F9">
        <div class="v">${completedHw}/${homework.length}</div>
        <div class="l">Tamamlanan Ödev</div>
      </div>
      <div class="metric" style="background:#F0F4F9">
        <div class="v">${completedLessons}/${lessons.length}</div>
        <div class="l">Tamamlanan Ders</div>
      </div>
    </div>

    <div class="two-col">
      <div class="box" style="background:#EAF4EE;border:1px solid #D1FAE5">
        <div class="box-title" style="color:#2E7D52">✓ Güçlü Konular</div>
        ${topicPerf.filter(t => t.accuracy_rate >= 70).length === 0
          ? '<div class="item" style="color:#7A8FA8">Henüz veri yok</div>'
          : topicPerf.filter(t => t.accuracy_rate >= 70).slice(0, 5).map(t => `
        <div class="item" style="display:flex;justify-content:space-between">
          <span>${t.subjects?.name} — ${t.topics?.name ?? 'Genel'}</span>
          <strong style="color:#2E7D52">%${Math.round(t.accuracy_rate)}</strong>
        </div>`).join('')}
      </div>
      <div class="box" style="background:#FEF2F2;border:1px solid #FEE2E2">
        <div class="box-title" style="color:#C0392B">⚠ Gelişim Alanları</div>
        ${topicPerf.filter(t => t.accuracy_rate < 50).length === 0
          ? '<div class="item" style="color:#2E7D52;font-weight:600">Kritik alan yok!</div>'
          : topicPerf.filter(t => t.accuracy_rate < 50).slice(0, 5).map(t => `
        <div class="item" style="display:flex;justify-content:space-between">
          <span>${t.subjects?.name} — ${t.topics?.name ?? 'Genel'}</span>
          <strong style="color:#C0392B">%${Math.round(t.accuracy_rate)}</strong>
        </div>`).join('')}
      </div>
    </div>

    ${homework.length > 0 ? `
    <div style="margin-bottom:20px">
      <div class="sec-title">Ödev Takibi</div>
      <table>
        <thead><tr><th>Ödev Adı</th><th>Durum</th></tr></thead>
        <tbody>
          ${homework.slice(0, 8).map(h => `
          <tr>
            <td>${h.tests?.name ?? '-'}</td>
            <td><span class="badge ${h.status === 'completed' ? 'good' : 'mid'}">${h.status === 'completed' ? 'Tamamlandı' : 'Bekliyor'}</span></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>` : ''}

    ${lessons.length > 0 ? `
    <div style="margin-bottom:20px">
      <div class="sec-title">Son Dersler</div>
      <table>
        <thead><tr><th>Ders</th><th>Öğretmen</th><th>Tarih</th><th>Durum</th></tr></thead>
        <tbody>
          ${lessons.slice(0, 6).map(l => `
          <tr>
            <td><strong>${l.subject ?? '-'}</strong></td>
            <td>${(l as any).profiles?.full_name ?? '-'}</td>
            <td>${new Date(l.scheduled_at).toLocaleDateString('tr-TR')}</td>
            <td><span class="badge ${l.status === 'completed' ? 'good' : l.status === 'cancelled' ? 'bad' : 'mid'}">${l.status === 'completed' ? 'Tamamlandı' : l.status === 'cancelled' ? 'İptal' : 'Planlandı'}</span></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>` : ''}

    ${goals.length > 0 ? `
    <div style="margin-bottom:20px">
      <div class="sec-title">Hedefler</div>
      <table>
        <thead><tr><th>Hedef Sınav</th><th>Hedef Puan</th><th>Mevcut Puan</th><th>İlerleme</th></tr></thead>
        <tbody>
          ${goals.map(g => {
            const prog = g.target_score > 0 ? Math.min(Math.round(g.current_score / g.target_score * 100), 100) : 0
            return `<tr>
              <td><strong>${g.target_exam}</strong></td>
              <td>${g.target_score}</td>
              <td>${g.current_score}</td>
              <td><strong style="color:${prog >= 80 ? '#2E7D52' : prog >= 50 ? '#B45309' : '#1B3A6B'}">%${prog}</strong></td>
            </tr>`
          }).join('')}
        </tbody>
      </table>
    </div>` : ''}

    ${aiReport ? `
    <div class="ai-box">
      <div class="ai-title">🤖 Akademik Danışman Yorumu</div>
      <div class="ai-content">${aiReport}</div>
    </div>` : ''}
  </div>
  <div class="footer">
    <span>DershaneOPS | dershaneops.vercel.app</span>
    <span>${new Date().toLocaleString('tr-TR')}</span>
  </div>
</div>
</body>
</html>`)
    win.document.close()
  }

  const totalQ = topicPerf.reduce((s, t) => s + t.total_questions, 0)
  const totalC = topicPerf.reduce((s, t) => s + t.correct_count, 0)
  const overallRate = totalQ > 0 ? Math.round(totalC / totalQ * 100) : 0
  const completedHw = homework.filter(h => h.status === 'completed').length
  const completedLessons = lessons.filter(l => l.status === 'completed').length
  const riskVal = Math.round(riskScore)

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#7A8FA8' }}>Yükleniyor...</div>

  return (
    <div style={{ padding: '28px', maxWidth: '1200px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', margin: 0 }}>Veli Raporu</h1>
        <p style={{ fontSize: '12px', color: '#7A8FA8', margin: '3px 0 0' }}>Veliye özel AI yorumlu gelişim raporu</p>
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
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>📋</div>
            <div style={{ fontSize: '14px', color: '#7A8FA8' }}>Rapor için öğrenci seçin</div>
          </div>
        ) : (
          <div>
            {/* Metrikler */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '16px' }}>
              {[
                { label: 'Genel Başarı', value: '%' + overallRate, color: overallRate >= 70 ? '#2E7D52' : overallRate >= 50 ? '#B45309' : '#C0392B', bg: overallRate >= 70 ? '#EAF4EE' : '#FDF4E7' },
                { label: 'Risk Skoru', value: riskVal + '/100', color: riskVal >= 70 ? '#C0392B' : riskVal >= 45 ? '#B45309' : '#2E7D52', bg: riskVal >= 70 ? '#FEF2F2' : '#FDF4E7' },
                { label: 'Ödev', value: completedHw + '/' + homework.length, color: '#6B4FC8', bg: '#F0ECFB' },
                { label: 'Ders', value: completedLessons + '/' + lessons.length, color: '#1B3A6B', bg: '#EEF3FB' },
              ].map(m => (
                <div key={m.label} style={{ background: m.bg, borderRadius: '10px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '11px', color: m.color, fontWeight: 600, marginBottom: '3px' }}>{m.label}</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: m.color }}>{m.value}</div>
                </div>
              ))}
            </div>

            {/* Güçlü / Zayıf */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: '#EAF4EE', border: '1px solid #D1FAE5', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#2E7D52', marginBottom: '10px' }}>✓ Güçlü Konular</div>
                {topicPerf.filter(t => t.accuracy_rate >= 70).length === 0 ? (
                  <div style={{ fontSize: '12px', color: '#7A8FA8' }}>Henüz veri yok</div>
                ) : topicPerf.filter(t => t.accuracy_rate >= 70).slice(0, 5).map(t => (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(0,0,0,0.05)', fontSize: '12.5px' }}>
                    <span style={{ color: '#374151' }}>{t.subjects?.name} — {t.topics?.name ?? 'Genel'}</span>
                    <strong style={{ color: '#2E7D52' }}>%{Math.round(t.accuracy_rate)}</strong>
                  </div>
                ))}
              </div>
              <div style={{ background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#C0392B', marginBottom: '10px' }}>⚠ Gelişim Alanları</div>
                {topicPerf.filter(t => t.accuracy_rate < 50).length === 0 ? (
                  <div style={{ fontSize: '12px', color: '#2E7D52', fontWeight: 600 }}>Kritik alan yok!</div>
                ) : topicPerf.filter(t => t.accuracy_rate < 50).slice(0, 5).map(t => (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(0,0,0,0.05)', fontSize: '12.5px' }}>
                    <span style={{ color: '#374151' }}>{t.subjects?.name} — {t.topics?.name ?? 'Genel'}</span>
                    <strong style={{ color: '#C0392B' }}>%{Math.round(t.accuracy_rate)}</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Rapor */}
            <div style={{ background: '#EEF3FB', border: '1px solid #BFDBFE', borderRadius: '12px', padding: '18px', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '10px' }}>🤖 AI Veli Raporu</div>
              {aiReport ? (
                <div style={{ fontSize: '13px', color: '#374151', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{aiReport}</div>
              ) : (
                <button onClick={getAiReport} disabled={aiLoading} style={{ padding: '9px 18px', borderRadius: '8px', background: '#1B3A6B', color: '#fff', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                  {aiLoading ? 'AI Rapor Hazırlıyor...' : 'AI ile Veli Raporu Oluştur'}
                </button>
              )}
            </div>

            {/* Aksiyon */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={printReport} style={{ padding: '10px 20px', borderRadius: '9px', background: '#1B3A6B', color: '#fff', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                🖨️ PDF / Yazdır
              </button>
              <button onClick={getAiReport} disabled={aiLoading} style={{ padding: '10px 20px', borderRadius: '9px', background: '#EEF3FB', color: '#1B3A6B', fontSize: '13px', fontWeight: 600, border: '1px solid #BFDBFE', cursor: 'pointer' }}>
                {aiLoading ? 'Hazırlanıyor...' : '🔄 Raporu Yenile'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}