'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function GuidancePage() {
  const [students, setStudents] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [riskData, setRiskData] = useState<any[]>([])
  const [attendance, setAttendance] = useState<any[]>([])
  const [topicPerf, setTopicPerf] = useState<any[]>([])
  const [homework, setHomework] = useState<any[]>([])
  const [streak, setStreak] = useState<any>(null)
  const [lessons, setLessons] = useState<any[]>([])
  const [goals, setGoals] = useState<any[]>([])
  const [riskScore, setRiskScore] = useState(0)
  const [aiGuidance, setAiGuidance] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('risk')
  const [attendanceForm, setAttendanceForm] = useState({ lesson_id: '', status: 'absent', notes: '' })
  const [savingAttendance, setSavingAttendance] = useState(false)
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const { data: s } = await supabase.from('profiles').select('id, full_name, created_at').eq('role', 'student').order('full_name')
    setStudents(s ?? [])

    // Tüm öğrenciler için risk skoru hesapla
    const riskList = []
    for (const st of (s ?? []).slice(0, 20)) {
      const { data: risk } = await supabase.rpc('calculate_risk_score', { p_student_id: st.id })
      const { data: tp } = await supabase.from('student_topic_performance').select('accuracy_rate').eq('student_id', st.id)
      const { data: hw } = await supabase.from('homework_assignments').select('status').eq('student_id', st.id)
      const { data: str } = await supabase.from('student_streaks').select('current_streak').eq('student_id', st.id).single()
      const avgRate = tp && tp.length > 0 ? Math.round(tp.reduce((a, t) => a + t.accuracy_rate, 0) / tp.length) : 0
      const hwRate = hw && hw.length > 0 ? Math.round(hw.filter(h => h.status === 'completed').length / hw.length * 100) : 0
      riskList.push({ ...st, risk_score: Math.round(risk ?? 0), avg_rate: avgRate, hw_rate: hwRate, streak: str?.current_streak ?? 0 })
    }
    riskList.sort((a, b) => b.risk_score - a.risk_score)
    setRiskData(riskList)
    setLoading(false)
  }

  async function selectStudent(s: any) {
    setSelected(s)
    setAiGuidance('')

    const [{ data: tp }, { data: hw }, { data: l }, { data: g }, { data: risk }, { data: str }, { data: att }] = await Promise.all([
      supabase.from('student_topic_performance').select('*, topics(name), subjects(name)').eq('student_id', s.id).order('accuracy_rate', { ascending: true }),
      supabase.from('homework_assignments').select('status, created_at').eq('student_id', s.id),
      supabase.from('lessons').select('*, profiles!lessons_teacher_id_fkey(full_name)').eq('student_id', s.id).order('scheduled_at', { ascending: false }).limit(20),
      supabase.from('student_goals').select('*').eq('student_id', s.id).eq('status', 'active'),
      supabase.rpc('calculate_risk_score', { p_student_id: s.id }),
      supabase.from('student_streaks').select('*').eq('student_id', s.id).single(),
      supabase.from('attendance').select('*, lessons(subject, scheduled_at)').eq('student_id', s.id).order('date', { ascending: false }),
    ])

    setTopicPerf(tp ?? [])
    setHomework(hw ?? [])
    setLessons(l ?? [])
    setGoals(g ?? [])
    setRiskScore(risk ?? 0)
    setStreak(str)
    setAttendance(att ?? [])
  }

  async function saveAttendance(e: React.FormEvent) {
    e.preventDefault()
    if (!selected || !attendanceForm.lesson_id) { alert('Ders seçin!'); return }
    setSavingAttendance(true)
    await supabase.from('attendance').upsert({
      tenant_id: '61cb6e2f-98d6-4fe7-a1c3-3afdfa7a728f',
      student_id: selected.id,
      lesson_id: attendanceForm.lesson_id,
      date: new Date().toISOString().slice(0, 10),
      status: attendanceForm.status,
      notes: attendanceForm.notes || null,
    }, { onConflict: 'student_id,lesson_id' })
    const { data: att } = await supabase.from('attendance').select('*, lessons(subject, scheduled_at)').eq('student_id', selected.id).order('date', { ascending: false })
    setAttendance(att ?? [])
    setAttendanceForm(p => ({ ...p, lesson_id: '', notes: '' }))
    setSavingAttendance(false)
  }

  async function getAiGuidance() {
    if (!selected) return
    setAiLoading(true)
    setAiGuidance('')
    const totalQ = topicPerf.reduce((s, t) => s + t.total_questions, 0)
    const totalC = topicPerf.reduce((s, t) => s + t.correct_count, 0)
    const overallRate = totalQ > 0 ? Math.round(totalC / totalQ * 100) : 0
    const completedHw = homework.filter(h => h.status === 'completed').length
    const hwRate = homework.length > 0 ? Math.round(completedHw / homework.length * 100) : 0
    const absentCount = attendance.filter(a => a.status === 'absent').length
    const weakTopics = topicPerf.filter(t => t.accuracy_rate < 50).map(t => t.subjects?.name + '-' + t.topics?.name).slice(0, 3).join(', ')

    try {
      const res = await fetch('/api/ai/guidance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_name: selected.full_name,
          overall_rate: overallRate,
          risk_score: Math.round(riskScore),
          hw_rate: hwRate,
          streak: streak?.current_streak ?? 0,
          absent_count: absentCount,
          weak_topics: weakTopics || 'Yok',
          goals: goals.map(g => g.target_exam + ' ' + g.target_score).join(', ') || 'Belirsiz',
        })
      })
      const d = await res.json()
      setAiGuidance(d.guidance ?? '')
    } catch { setAiGuidance('AI rehberlik raporu alınamadı.') }
    setAiLoading(false)
  }

  function printGuidanceReport() {
    if (!selected) return
    const totalQ = topicPerf.reduce((s, t) => s + t.total_questions, 0)
    const totalC = topicPerf.reduce((s, t) => s + t.correct_count, 0)
    const overallRate = totalQ > 0 ? Math.round(totalC / totalQ * 100) : 0
    const completedHw = homework.filter(h => h.status === 'completed').length
    const hwRate = homework.length > 0 ? Math.round(completedHw / homework.length * 100) : 0
    const absentCount = attendance.filter(a => a.status === 'absent').length
    const riskVal = Math.round(riskScore)

    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<title>${selected.full_name} — Rehberlik Raporu</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Noto Sans',Arial,sans-serif;background:#f0f4f9;color:#1B3A6B}
  @media print{body{background:#fff}.no-print{display:none}@page{margin:0;size:A4}{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  .page{width:210mm;min-height:297mm;margin:0 auto;background:#fff}
  .header{background:#1B3A6B;padding:20px 28px;display:flex;justify-content:space-between;align-items:center}
  .header h1{font-size:20px;font-weight:800;color:#fff}
  .header p{font-size:11px;color:rgba(255,255,255,0.7);margin-top:2px}
  .content{padding:22px 28px 60px}
  .student{font-size:22px;font-weight:800;margin-bottom:3px}
  .sub{font-size:11px;color:#7A8FA8;margin-bottom:18px}
  .metrics{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:20px}
  .metric{border-radius:8px;padding:12px;text-align:center}
  .metric .v{font-size:20px;font-weight:800}
  .metric .l{font-size:9px;color:#7A8FA8;margin-top:2px;text-transform:uppercase}
  .section{margin-bottom:18px}
  .sec-title{font-size:12px;font-weight:700;color:#fff;background:#1B3A6B;padding:7px 14px;border-radius:5px 5px 0 0}
  table{width:100%;border-collapse:collapse;font-size:11px}
  th{background:#2A4A8A;color:#fff;padding:8px 12px;text-align:left;font-weight:600}
  td{padding:7px 12px;border-bottom:1px solid #F0F4F9;color:#374151}
  tr:nth-child(even) td{background:#F8FAFF}
  .badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700}
  .good{background:#EAF4EE;color:#2E7D52}
  .mid{background:#FDF4E7;color:#B45309}
  .bad{background:#FEF2F2;color:#C0392B}
  .ai-box{background:#EEF3FB;border:1px solid #BFDBFE;border-radius:8px;padding:16px;margin-top:16px}
  .ai-title{font-size:12px;font-weight:700;color:#1B3A6B;margin-bottom:8px}
  .ai-content{font-size:12px;color:#374151;line-height:1.9;white-space:pre-wrap}
  .footer{background:#1B3A6B;padding:10px 28px;display:flex;justify-content:space-between;font-size:9px;color:rgba(255,255,255,0.6);position:fixed;bottom:0;width:210mm}
  .no-print{position:fixed;top:16px;right:16px;display:flex;gap:8px}
  .no-print button{padding:10px 18px;border:none;border-radius:8px;font-family:'Noto Sans',sans-serif;font-size:13px;font-weight:700;cursor:pointer}
  .btn-p{background:#1B3A6B;color:#fff}
  .btn-c{background:#f0f4f9;color:#1B3A6B}
</style>
</head>
<body>
<div class="no-print">
  <button class="btn-p" onclick="window.print()">🖨️ Yazdır / PDF</button>
  <button class="btn-c" onclick="window.close()">✕ Kapat</button>
</div>
<div class="page">
  <div class="header">
    <div><h1>DershaneOPS</h1><p>Rehberlik Raporu</p></div>
    <div style="font-size:11px;color:rgba(255,255,255,0.6);text-align:right">${new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
  </div>
  <div class="content">
    <div class="student">${selected.full_name}</div>
    <div class="sub">Rehberlik & Akademik Durum Raporu • ${new Date().toLocaleString('tr-TR')}</div>

    <div class="metrics">
      <div class="metric" style="background:#F0F4F9"><div class="v" style="color:${overallRate >= 70 ? '#2E7D52' : overallRate >= 50 ? '#B45309' : '#C0392B'}">%${overallRate}</div><div class="l">Genel Başarı</div></div>
      <div class="metric" style="background:#F0F4F9"><div class="v" style="color:${riskVal >= 70 ? '#C0392B' : riskVal >= 45 ? '#B45309' : '#2E7D52'}">${riskVal}/100</div><div class="l">Risk Skoru</div></div>
      <div class="metric" style="background:#F0F4F9"><div class="v">%${hwRate}</div><div class="l">Ödev Tamamlama</div></div>
      <div class="metric" style="background:#F0F4F9"><div class="v" style="color:#C0392B">${absentCount}</div><div class="l">Devamsızlık</div></div>
      <div class="metric" style="background:#F0F4F9"><div class="v" style="color:#B45309">${streak?.current_streak ?? 0}</div><div class="l">Gün Serisi</div></div>
    </div>

    ${topicPerf.filter(t => t.accuracy_rate < 50).length > 0 ? `
    <div class="section">
      <div class="sec-title">Zayıf Konular (Öncelikli Müdahale)</div>
      <table>
        <thead><tr><th>Ders</th><th>Konu</th><th>Başarı %</th><th>Durum</th></tr></thead>
        <tbody>
          ${topicPerf.filter(t => t.accuracy_rate < 50).map(t => `
          <tr>
            <td>${t.subjects?.name ?? '-'}</td>
            <td><strong>${t.topics?.name ?? 'Genel'}</strong></td>
            <td><strong style="color:#C0392B">%${Math.round(t.accuracy_rate)}</strong></td>
            <td><span class="badge bad">Kritik</span></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>` : ''}

    ${attendance.length > 0 ? `
    <div class="section">
      <div class="sec-title">Devamsızlık Kaydı</div>
      <table>
        <thead><tr><th>Tarih</th><th>Ders</th><th>Durum</th><th>Not</th></tr></thead>
        <tbody>
          ${attendance.slice(0, 10).map(a => `
          <tr>
            <td>${new Date(a.date).toLocaleDateString('tr-TR')}</td>
            <td>${a.lessons?.subject ?? '-'}</td>
            <td><span class="badge ${a.status === 'present' ? 'good' : a.status === 'absent' ? 'bad' : 'mid'}">${a.status === 'present' ? 'Katıldı' : a.status === 'absent' ? 'Gelmedi' : a.status === 'late' ? 'Geç' : 'Mazeretli'}</span></td>
            <td style="font-size:10px;color:#7A8FA8">${a.notes ?? ''}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>` : ''}

    ${goals.length > 0 ? `
    <div class="section">
      <div class="sec-title">Hedefler</div>
      <table>
        <thead><tr><th>Hedef Sınav</th><th>Hedef Puan</th><th>Mevcut</th><th>Tarih</th></tr></thead>
        <tbody>
          ${goals.map(g => `<tr><td><strong>${g.target_exam}</strong></td><td>${g.target_score}</td><td>${g.current_score}</td><td>${g.target_date ? new Date(g.target_date).toLocaleDateString('tr-TR') : '-'}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>` : ''}

    ${aiGuidance ? `
    <div class="ai-box">
      <div class="ai-title">🤖 Rehberlik Önerileri (AI)</div>
      <div class="ai-content">${aiGuidance}</div>
    </div>` : ''}
  </div>
  <div class="footer">
    <span>DershaneOPS | dershaneops.vercel.app</span>
    <span>Rehberlik Servisi Gizli Belgesi</span>
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
  const hwRate = homework.length > 0 ? Math.round(completedHw / homework.length * 100) : 0
  const absentCount = attendance.filter(a => a.status === 'absent').length
  const riskVal = Math.round(riskScore)

  const TABS = [
    { id: 'risk', label: '🚨 Risk Paneli' },
    { id: 'profile', label: '👤 Öğrenci Profili' },
    { id: 'attendance', label: '📋 Devamsızlık' },
    { id: 'guidance', label: '🧭 Rehberlik Önerileri' },
  ]

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#7A8FA8' }}>Yükleniyor...</div>

  return (
    <div style={{ padding: '28px', maxWidth: '1300px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', margin: 0 }}>Rehberlik Modülü</h1>
        <p style={{ fontSize: '12px', color: '#7A8FA8', margin: '3px 0 0' }}>Risk analizi, devamsızlık takibi ve AI rehberlik önerileri</p>
      </div>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: '#F0F4F9', borderRadius: '10px', padding: '4px' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flex: 1, padding: '8px', borderRadius: '7px', border: 'none', cursor: 'pointer', background: activeTab === tab.id ? '#fff' : 'transparent', color: activeTab === tab.id ? '#1B3A6B' : '#7A8FA8', fontSize: '12.5px', fontWeight: activeTab === tab.id ? 700 : 500 }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* RİSK PANELİ */}
      {activeTab === 'risk' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '20px' }}>
            {[
              { label: 'Kritik Risk (70+)', value: riskData.filter(s => s.risk_score >= 70).length, color: '#C0392B', bg: '#FEF2F2' },
              { label: 'Yüksek Risk (45-70)', value: riskData.filter(s => s.risk_score >= 45 && s.risk_score < 70).length, color: '#B45309', bg: '#FDF4E7' },
              { label: 'Orta Risk (20-45)', value: riskData.filter(s => s.risk_score >= 20 && s.risk_score < 45).length, color: '#1B3A6B', bg: '#EEF3FB' },
              { label: 'Düşük Risk (0-20)', value: riskData.filter(s => s.risk_score < 20).length, color: '#2E7D52', bg: '#EAF4EE' },
            ].map(m => (
              <div key={m.label} style={{ background: m.bg, borderRadius: '10px', padding: '14px 16px' }}>
                <div style={{ fontSize: '11px', color: m.color, fontWeight: 600, marginBottom: '4px' }}>{m.label}</div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: m.color }}>{m.value}</div>
              </div>
            ))}
          </div>

          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #D5DFF0', fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>
              Tüm Öğrenciler — Risk Sıralaması
            </div>
            {riskData.map((s, i) => {
              const rl = s.risk_score >= 70 ? { color: '#C0392B', bg: '#FEF2F2', label: 'Kritik' } :
                        s.risk_score >= 45 ? { color: '#B45309', bg: '#FDF4E7', label: 'Yüksek' } :
                        s.risk_score >= 20 ? { color: '#1B3A6B', bg: '#EEF3FB', label: 'Orta' } :
                        { color: '#2E7D52', bg: '#EAF4EE', label: 'İyi' }
              return (
                <div key={s.id} onClick={() => { selectStudent(s); setActiveTab('profile') }} style={{ padding: '13px 18px', borderBottom: i < riskData.length - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', background: selected?.id === s.id ? '#F5F8FF' : '#fff' }}>
                  <div style={{ width: '28px', textAlign: 'center', fontSize: '14px', fontWeight: 700, color: '#9CA3AF', flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#E2EAF8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#1B3A6B', flexShrink: 0 }}>
                    {s.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#1B3A6B', marginBottom: '2px' }}>{s.full_name}</div>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#7A8FA8' }}>
                      <span>Başarı: %{s.avg_rate}</span>
                      <span>Ödev: %{s.hw_rate}</span>
                      <span>Seri: {s.streak} gün</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: rl.color }}>{s.risk_score}</div>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', background: rl.bg, color: rl.color }}>{rl.label}</span>
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#7A8FA8' }}>Profil →</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ÖĞRENCİ PROFİLİ */}
      {activeTab === 'profile' && (
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden', alignSelf: 'flex-start' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #D5DFF0', fontSize: '12.5px', fontWeight: 700, color: '#1B3A6B' }}>Öğrenci Seç</div>
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {students.map(s => (
                <div key={s.id} onClick={() => selectStudent(s)} style={{ padding: '11px 16px', borderBottom: '1px solid #F0F4F9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', background: selected?.id === s.id ? '#F5F8FF' : '#fff', borderLeft: selected?.id === s.id ? '3px solid #1B3A6B' : '3px solid transparent' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: selected?.id === s.id ? '#1B3A6B' : '#E2EAF8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: selected?.id === s.id ? '#fff' : '#1B3A6B', flexShrink: 0 }}>
                    {s.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                  </div>
                  <span style={{ fontSize: '12.5px', fontWeight: selected?.id === s.id ? 700 : 500, color: '#1B3A6B' }}>{s.full_name}</span>
                </div>
              ))}
            </div>
          </div>

          {!selected ? (
            <div style={{ background: '#F8FAFF', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '60px', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>👤</div>
              <div style={{ fontSize: '14px', color: '#7A8FA8' }}>Öğrenci seçin</div>
            </div>
          ) : (
            <div>
              <div style={{ background: '#1B3A6B', borderRadius: '12px', padding: '18px 22px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                  {selected.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>{selected.full_name}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>
                    Kayıt: {new Date(selected.created_at).toLocaleDateString('tr-TR')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={getAiGuidance} disabled={aiLoading} style={{ padding: '8px 14px', borderRadius: '8px', background: '#6B4FC8', color: '#fff', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                    {aiLoading ? 'AI...' : 'AI Rehberlik'}
                  </button>
                  <button onClick={printGuidanceReport} style={{ padding: '8px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                    🖨️ PDF
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '10px', marginBottom: '14px' }}>
                {[
                  { label: 'Başarı', value: '%' + overallRate, color: overallRate >= 70 ? '#2E7D52' : overallRate >= 50 ? '#B45309' : '#C0392B', bg: overallRate >= 70 ? '#EAF4EE' : '#FDF4E7' },
                  { label: 'Risk', value: riskVal + '/100', color: riskVal >= 70 ? '#C0392B' : riskVal >= 45 ? '#B45309' : '#2E7D52', bg: riskVal >= 70 ? '#FEF2F2' : '#FDF4E7' },
                  { label: 'Ödev', value: '%' + hwRate, color: '#6B4FC8', bg: '#F0ECFB' },
                  { label: 'Devamsızlık', value: absentCount, color: absentCount >= 5 ? '#C0392B' : '#1B3A6B', bg: absentCount >= 5 ? '#FEF2F2' : '#EEF3FB' },
                  { label: 'Gün Serisi', value: streak?.current_streak ?? 0, color: '#B45309', bg: '#FDF4E7' },
                ].map(m => (
                  <div key={m.label} style={{ background: m.bg, borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: m.color }}>{m.value}</div>
                    <div style={{ fontSize: '10px', color: '#7A8FA8', marginTop: '2px' }}>{m.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div style={{ background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: '12px', padding: '14px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#C0392B', marginBottom: '8px' }}>⚠ Zayıf Konular</div>
                  {topicPerf.filter(t => t.accuracy_rate < 50).length === 0 ? (
                    <div style={{ fontSize: '12px', color: '#2E7D52', fontWeight: 600 }}>Kritik alan yok!</div>
                  ) : topicPerf.filter(t => t.accuracy_rate < 50).slice(0, 4).map(t => (
                    <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(0,0,0,0.05)', fontSize: '12px' }}>
                      <span style={{ color: '#374151' }}>{t.subjects?.name} — {t.topics?.name ?? 'Genel'}</span>
                      <strong style={{ color: '#C0392B' }}>%{Math.round(t.accuracy_rate)}</strong>
                    </div>
                  ))}
                </div>

                <div style={{ background: '#EAF4EE', border: '1px solid #D1FAE5', borderRadius: '12px', padding: '14px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#2E7D52', marginBottom: '8px' }}>✓ Güçlü Konular</div>
                  {topicPerf.filter(t => t.accuracy_rate >= 70).length === 0 ? (
                    <div style={{ fontSize: '12px', color: '#7A8FA8' }}>Henüz veri yok</div>
                  ) : topicPerf.filter(t => t.accuracy_rate >= 70).slice(0, 4).map(t => (
                    <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(0,0,0,0.05)', fontSize: '12px' }}>
                      <span style={{ color: '#374151' }}>{t.subjects?.name} — {t.topics?.name ?? 'Genel'}</span>
                      <strong style={{ color: '#2E7D52' }}>%{Math.round(t.accuracy_rate)}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {aiGuidance && (
                <div style={{ background: '#EEF3FB', border: '1px solid #BFDBFE', borderRadius: '12px', padding: '18px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '10px' }}>🧭 AI Rehberlik Önerileri</div>
                  <div style={{ fontSize: '13px', color: '#374151', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{aiGuidance}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* DEVAMSIZLIK */}
      {activeTab === 'attendance' && (
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden', alignSelf: 'flex-start' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #D5DFF0', fontSize: '12.5px', fontWeight: 700, color: '#1B3A6B' }}>Öğrenci Seç</div>
            {students.map(s => (
              <div key={s.id} onClick={() => selectStudent(s)} style={{ padding: '10px 16px', borderBottom: '1px solid #F0F4F9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', background: selected?.id === s.id ? '#F5F8FF' : '#fff', borderLeft: selected?.id === s.id ? '3px solid #1B3A6B' : '3px solid transparent' }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: selected?.id === s.id ? '#1B3A6B' : '#E2EAF8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: selected?.id === s.id ? '#fff' : '#1B3A6B', flexShrink: 0 }}>
                  {s.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </div>
                <span style={{ fontSize: '12px', fontWeight: selected?.id === s.id ? 700 : 500, color: '#1B3A6B' }}>{s.full_name}</span>
              </div>
            ))}
          </div>

          {!selected ? (
            <div style={{ background: '#F8FAFF', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '60px', textAlign: 'center' }}>
              <div style={{ fontSize: '14px', color: '#7A8FA8' }}>Öğrenci seçin</div>
            </div>
          ) : (
            <div>
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '18px', marginBottom: '14px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '14px' }}>Devamsızlık Kaydet — {selected.full_name}</div>
                <form onSubmit={saveAttendance}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#4A6080', marginBottom: '5px' }}>Ders *</label>
                      <select value={attendanceForm.lesson_id} onChange={e => setAttendanceForm(p => ({ ...p, lesson_id: e.target.value }))} style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid #D5DFF0', fontSize: '12.5px', color: '#1B3A6B', outline: 'none', background: '#fff' }} required>
                        <option value="">Ders seçin...</option>
                        {lessons.map(l => <option key={l.id} value={l.id}>{l.subject} — {new Date(l.scheduled_at).toLocaleDateString('tr-TR')}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#4A6080', marginBottom: '5px' }}>Durum</label>
                      <select value={attendanceForm.status} onChange={e => setAttendanceForm(p => ({ ...p, status: e.target.value }))} style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid #D5DFF0', fontSize: '12.5px', color: '#1B3A6B', outline: 'none', background: '#fff' }}>
                        <option value="present">Katıldı</option>
                        <option value="absent">Gelmedi</option>
                        <option value="late">Geç Geldi</option>
                        <option value="excused">Mazeretli</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#4A6080', marginBottom: '5px' }}>Not</label>
                      <input value={attendanceForm.notes} onChange={e => setAttendanceForm(p => ({ ...p, notes: e.target.value }))} placeholder="Açıklama..." style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid #D5DFF0', fontSize: '12.5px', color: '#1B3A6B', outline: 'none', background: '#fff', boxSizing: 'border-box' as const }} />
                    </div>
                  </div>
                  <button type="submit" disabled={savingAttendance} style={{ padding: '9px 20px', borderRadius: '8px', background: '#1B3A6B', color: '#fff', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                    {savingAttendance ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </form>
              </div>

              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #D5DFF0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>Devamsızlık Kayıtları</div>
                  <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
                    {[
                      { label: 'Gelmedi', value: attendance.filter(a => a.status === 'absent').length, color: '#C0392B' },
                      { label: 'Geç', value: attendance.filter(a => a.status === 'late').length, color: '#B45309' },
                      { label: 'Mazeretli', value: attendance.filter(a => a.status === 'excused').length, color: '#6B4FC8' },
                    ].map(m => (
                      <span key={m.label} style={{ padding: '3px 10px', borderRadius: '10px', background: '#F0F4F9', color: m.color, fontWeight: 700 }}>
                        {m.label}: {m.value}
                      </span>
                    ))}
                  </div>
                </div>
                {attendance.length === 0 ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: '#7A8FA8', fontSize: '13px' }}>Henüz kayıt yok</div>
                ) : attendance.map((a, i) => (
                  <div key={a.id} style={{ padding: '11px 18px', borderBottom: i < attendance.length - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: a.status === 'present' ? '#2E7D52' : a.status === 'absent' ? '#C0392B' : a.status === 'late' ? '#B45309' : '#6B4FC8', flexShrink: 0 }} />
                    <div style={{ flex: 1, fontSize: '12.5px', color: '#374151' }}>
                      <strong>{a.lessons?.subject ?? '-'}</strong>
                      {a.notes && <span style={{ color: '#7A8FA8', marginLeft: '8px', fontSize: '11.5px' }}>{a.notes}</span>}
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '8px', background: a.status === 'present' ? '#EAF4EE' : a.status === 'absent' ? '#FEF2F2' : a.status === 'late' ? '#FDF4E7' : '#F0ECFB', color: a.status === 'present' ? '#2E7D52' : a.status === 'absent' ? '#C0392B' : a.status === 'late' ? '#B45309' : '#6B4FC8' }}>
                      {a.status === 'present' ? 'Katıldı' : a.status === 'absent' ? 'Gelmedi' : a.status === 'late' ? 'Geç Geldi' : 'Mazeretli'}
                    </span>
                    <span style={{ fontSize: '11px', color: '#9CA3AF', flexShrink: 0 }}>{new Date(a.date).toLocaleDateString('tr-TR')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* REHBERLİK ÖNERİLERİ */}
      {activeTab === 'guidance' && (
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden', alignSelf: 'flex-start' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #D5DFF0', fontSize: '12.5px', fontWeight: 700, color: '#1B3A6B' }}>Öğrenci Seç</div>
            {students.map(s => (
              <div key={s.id} onClick={() => selectStudent(s)} style={{ padding: '10px 16px', borderBottom: '1px solid #F0F4F9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', background: selected?.id === s.id ? '#F5F8FF' : '#fff', borderLeft: selected?.id === s.id ? '3px solid #1B3A6B' : '3px solid transparent' }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: selected?.id === s.id ? '#1B3A6B' : '#E2EAF8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: selected?.id === s.id ? '#fff' : '#1B3A6B', flexShrink: 0 }}>
                  {s.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </div>
                <span style={{ fontSize: '12px', fontWeight: selected?.id === s.id ? 700 : 500, color: '#1B3A6B' }}>{s.full_name}</span>
              </div>
            ))}
          </div>

          {!selected ? (
            <div style={{ background: '#F8FAFF', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '60px', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>🧭</div>
              <div style={{ fontSize: '14px', color: '#7A8FA8' }}>Öğrenci seçin</div>
            </div>
          ) : (
            <div>
              <div style={{ background: '#EEF3FB', border: '1px solid #BFDBFE', borderRadius: '12px', padding: '20px', marginBottom: '14px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#1B3A6B', marginBottom: '12px' }}>🧭 AI Rehberlik Önerileri — {selected.full_name}</div>
                {aiGuidance ? (
                  <div style={{ fontSize: '13.5px', color: '#374151', lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>{aiGuidance}</div>
                ) : (
                  <button onClick={getAiGuidance} disabled={aiLoading} style={{ padding: '10px 20px', borderRadius: '8px', background: '#1B3A6B', color: '#fff', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                    {aiLoading ? 'AI Analiz Yapıyor...' : 'AI Rehberlik Raporu Oluştur'}
                  </button>
                )}
              </div>

              {aiGuidance && (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={printGuidanceReport} style={{ padding: '10px 20px', borderRadius: '9px', background: '#1B3A6B', color: '#fff', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                    🖨️ PDF / Yazdır
                  </button>
                  <button onClick={getAiGuidance} disabled={aiLoading} style={{ padding: '10px 20px', borderRadius: '9px', background: '#EEF3FB', color: '#1B3A6B', fontSize: '13px', fontWeight: 600, border: '1px solid #BFDBFE', cursor: 'pointer' }}>
                    🔄 Yenile
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}