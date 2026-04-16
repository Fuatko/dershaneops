'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function InstitutionPage() {
  const [stats, setStats] = useState<any>(null)
  const [teacherStats, setTeacherStats] = useState<any[]>([])
  const [subjectStats, setSubjectStats] = useState<any[]>([])
  const [riskStudents, setRiskStudents] = useState<any[]>([])
  const [topStudents, setTopStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [aiInsight, setAiInsight] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const [
      { data: profiles },
      { data: lessons },
      { data: homework },
      { data: attempts },
      { data: topicPerf },
      { data: exams },
    ] = await Promise.all([
      supabase.from('profiles').select('id, full_name, role').in('role', ['student', 'teacher', 'parent']),
      supabase.from('lessons').select('teacher_id, status, profiles!lessons_teacher_id_fkey(full_name)'),
      supabase.from('homework_assignments').select('status, student_id'),
      supabase.from('student_question_attempts').select('student_id, total_questions, correct_count'),
      supabase.from('student_topic_performance').select('student_id, subject_id, accuracy_rate, subjects(name, color)'),
      supabase.from('exams').select('id, name'),
    ])

    const students = (profiles ?? []).filter(p => p.role === 'student')
    const teachers = (profiles ?? []).filter(p => p.role === 'teacher')
    const totalQ = (attempts ?? []).reduce((s, a) => s + a.total_questions, 0)
    const totalC = (attempts ?? []).reduce((s, a) => s + a.correct_count, 0)
    const overallRate = totalQ > 0 ? Math.round(totalC / totalQ * 100) : 0
    const completedHw = (homework ?? []).filter(h => h.status === 'completed').length
    const totalHw = (homework ?? []).length

    setStats({
      studentCount: students.length,
      teacherCount: teachers.length,
      lessonCount: (lessons ?? []).length,
      completedLessons: (lessons ?? []).filter(l => l.status === 'completed').length,
      overallRate,
      totalQ,
      hwRate: totalHw > 0 ? Math.round(completedHw / totalHw * 100) : 0,
      examCount: (exams ?? []).length,
    })

    // Öğretmen bazlı istatistik
    const teacherMap: any = {}
    for (const l of lessons ?? []) {
      if (!l.teacher_id) continue
      if (!teacherMap[l.teacher_id]) teacherMap[l.teacher_id] = { name: l.profiles?.full_name, total: 0, completed: 0 }
      teacherMap[l.teacher_id].total++
      if (l.status === 'completed') teacherMap[l.teacher_id].completed++
    }

    const teacherPerf = Object.values(teacherMap).map((t: any) => ({
      ...t,
      rate: t.total > 0 ? Math.round(t.completed / t.total * 100) : 0
    })).sort((a: any, b: any) => b.completed - a.completed)
    setTeacherStats(teacherPerf)

    // Ders bazlı ortalama
    const subjectMap: any = {}
    for (const tp of topicPerf ?? []) {
      const name = tp.subjects?.name ?? 'Diğer'
      const color = tp.subjects?.color ?? '#1B3A6B'
      if (!subjectMap[name]) subjectMap[name] = { rates: [], color }
      subjectMap[name].rates.push(tp.accuracy_rate)
    }
    const subjectPerf = Object.entries(subjectMap).map(([name, data]: any) => ({
      name,
      color: data.color,
      avg: Math.round(data.rates.reduce((a: number, b: number) => a + b, 0) / data.rates.length),
      count: data.rates.length,
    })).sort((a, b) => a.avg - b.avg)
    setSubjectStats(subjectPerf)

    // Risk skorları
    const riskList = []
    for (const s of students.slice(0, 10)) {
      const { data: risk } = await supabase.rpc('calculate_risk_score', { p_student_id: s.id })
      if ((risk ?? 0) >= 45) riskList.push({ ...s, risk_score: risk ?? 0 })
    }
    riskList.sort((a, b) => b.risk_score - a.risk_score)
    setRiskStudents(riskList)

    // Top öğrenciler
    const studentPerf = students.map(s => {
      const sAttempts = (attempts ?? []).filter(a => a.student_id === s.id)
      const sQ = sAttempts.reduce((sum, a) => sum + a.total_questions, 0)
      const sC = sAttempts.reduce((sum, a) => sum + a.correct_count, 0)
      return { ...s, rate: sQ > 0 ? Math.round(sC / sQ * 100) : 0, total_questions: sQ }
    }).filter(s => s.total_questions > 0).sort((a, b) => b.rate - a.rate).slice(0, 5)
    setTopStudents(studentPerf)

    setLoading(false)
  }

  async function getAiInsight() {
    if (!stats) return
    setAiLoading(true)
    setAiInsight('')
    try {
      const res = await fetch('/api/ai/institution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_count: stats.studentCount,
          teacher_count: stats.teacherCount,
          overall_rate: stats.overallRate,
          hw_rate: stats.hwRate,
          risk_count: riskStudents.length,
          weak_subjects: subjectStats.slice(0, 2).map(s => s.name + ' (%' + s.avg + ')').join(', '),
          strong_subjects: subjectStats.slice(-2).map(s => s.name + ' (%' + s.avg + ')').join(', '),
        })
      })
      const d = await res.json()
      setAiInsight(d.insight ?? '')
    } catch { setAiInsight('AI analizi alınamadı.') }
    setAiLoading(false)
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#7A8FA8' }}>Kurum verileri yükleniyor...</div>

  return (
    <div style={{ padding: '28px', maxWidth: '1200px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', margin: 0 }}>Kurum Zekası</h1>
          <p style={{ fontSize: '12px', color: '#7A8FA8', margin: '3px 0 0' }}>Kurum geneli performans, öğretmen etkinliği ve risk analizi</p>
        </div>
        <button onClick={getAiInsight} disabled={aiLoading} style={{ padding: '9px 18px', borderRadius: '9px', background: '#6B4FC8', color: '#fff', fontSize: '12.5px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
          {aiLoading ? 'AI Analiz Yapıyor...' : 'AI Kurum Analizi'}
        </button>
      </div>

      {/* AI Insight */}
      {aiInsight && (
        <div style={{ background: '#F0ECFB', border: '1px solid #C4B5FD', borderRadius: '12px', padding: '18px', marginBottom: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#6B4FC8', marginBottom: '8px' }}>AI Kurum Değerlendirmesi</div>
          <div style={{ fontSize: '13px', color: '#374151', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{aiInsight}</div>
        </div>
      )}

      {/* Ana Metrikler */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '20px' }}>
          {[
            { label: 'Toplam Öğrenci', value: stats.studentCount, color: '#1B3A6B', bg: '#EEF3FB' },
            { label: 'Genel Başarı', value: '%' + stats.overallRate, color: stats.overallRate >= 70 ? '#2E7D52' : stats.overallRate >= 50 ? '#B45309' : '#C0392B', bg: stats.overallRate >= 70 ? '#EAF4EE' : '#FDF4E7' },
            { label: 'Ödev Tamamlama', value: '%' + stats.hwRate, color: '#6B4FC8', bg: '#F0ECFB' },
            { label: 'Risk Altındaki', value: riskStudents.length, color: '#C0392B', bg: '#FEF2F2' },
          ].map(m => (
            <div key={m.label} style={{ background: m.bg, borderRadius: '10px', padding: '14px 16px' }}>
              <div style={{ fontSize: '11px', color: m.color, fontWeight: 600, marginBottom: '4px' }}>{m.label}</div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: m.color }}>{m.value}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>

        {/* Ders Bazlı Performans */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '18px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '14px' }}>Ders Bazlı Kurum Ortalaması</div>
          {subjectStats.length === 0 ? (
            <div style={{ fontSize: '12px', color: '#7A8FA8' }}>Veri yok</div>
          ) : subjectStats.map(s => (
            <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div style={{ width: '80px', fontSize: '12.5px', fontWeight: 600, color: '#1B3A6B', flexShrink: 0 }}>{s.name}</div>
              <div style={{ flex: 1, height: '8px', background: '#F0F4F9', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: s.avg + '%', background: s.avg >= 70 ? '#2E7D52' : s.avg >= 50 ? '#B45309' : '#C0392B', borderRadius: '4px' }} />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 700, color: s.avg >= 70 ? '#2E7D52' : s.avg >= 50 ? '#B45309' : '#C0392B', width: '40px', textAlign: 'right', flexShrink: 0 }}>%{s.avg}</span>
            </div>
          ))}
        </div>

        {/* Öğretmen Etkinliği */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '18px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '14px' }}>Öğretmen Ders Takibi</div>
          {teacherStats.length === 0 ? (
            <div style={{ fontSize: '12px', color: '#7A8FA8' }}>Veri yok</div>
          ) : teacherStats.map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: i < teacherStats.length - 1 ? '1px solid #F0F4F9' : 'none' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#EAF4EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#2E7D52', flexShrink: 0 }}>
                {t.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#1B3A6B' }}>{t.name}</div>
                <div style={{ fontSize: '11px', color: '#7A8FA8' }}>{t.completed}/{t.total} ders tamamlandı</div>
              </div>
              <span style={{ fontSize: '13px', fontWeight: 700, color: t.rate >= 80 ? '#2E7D52' : t.rate >= 60 ? '#B45309' : '#C0392B' }}>%{t.rate}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

        {/* Risk Öğrenciler */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #D5DFF0', fontSize: '13px', fontWeight: 700, color: '#C0392B' }}>
            Risk Altındaki Öğrenciler
          </div>
          {riskStudents.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', fontSize: '13px', color: '#2E7D52' }}>Kritik risk yok!</div>
          ) : riskStudents.map((s, i) => {
            const rl = s.risk_score >= 70 ? { color: '#C0392B', bg: '#FEF2F2', label: 'Kritik' } : { color: '#B45309', bg: '#FDF4E7', label: 'Yüksek' }
            return (
              <div key={s.id} style={{ padding: '12px 18px', borderBottom: i < riskStudents.length - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#E2EAF8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: '#1B3A6B', flexShrink: 0 }}>
                  {s.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </div>
                <span style={{ flex: 1, fontSize: '12.5px', fontWeight: 600, color: '#1B3A6B' }}>{s.full_name}</span>
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: rl.color }}>{Math.round(s.risk_score)}</div>
                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '8px', background: rl.bg, color: rl.color }}>{rl.label}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Top Öğrenciler */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #D5DFF0', fontSize: '13px', fontWeight: 700, color: '#2E7D52' }}>
            En Başarılı Öğrenciler
          </div>
          {topStudents.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', fontSize: '13px', color: '#7A8FA8' }}>Veri yok</div>
          ) : topStudents.map((s, i) => (
            <div key={s.id} style={{ padding: '12px 18px', borderBottom: i < topStudents.length - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '24px', fontSize: '14px', fontWeight: 800, color: i === 0 ? '#B45309' : i === 1 ? '#4A6080' : '#9CA3AF', flexShrink: 0, textAlign: 'center' }}>
                {i + 1}
              </div>
              <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#EAF4EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: '#2E7D52', flexShrink: 0 }}>
                {s.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </div>
              <span style={{ flex: 1, fontSize: '12.5px', fontWeight: 600, color: '#1B3A6B' }}>{s.full_name}</span>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#2E7D52' }}>%{s.rate}</div>
                <div style={{ fontSize: '10px', color: '#7A8FA8' }}>{s.total_questions} soru</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}