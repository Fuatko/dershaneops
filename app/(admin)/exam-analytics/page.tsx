'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ExamAnalyticsPage() {
  const [exams, setExams]           = useState<any[]>([])
  const [students, setStudents]     = useState<any[]>([])
  const [subjects, setSubjects]     = useState<any[]>([])
  const [selectedExam, setSelectedExam] = useState<any>(null)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [examResults, setExamResults] = useState<any[]>([])
  const [allResults, setAllResults]   = useState<any[]>([])
  const [loading, setLoading]         = useState(true)
  const [view, setView] = useState<'exam'|'student'>('exam')
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const [
      { data: ex },
      { data: st },
      { data: sb },
    ] = await Promise.all([
      supabase.from('exams').select('*').order('exam_date', { ascending: false }),
      supabase.from('profiles').select('id, full_name, grade_level').eq('role', 'student').order('full_name'),
      supabase.from('subjects').select('id, name, color, section').order('section').order('name'),
    ])
    setExams(ex ?? [])
    setStudents(st ?? [])
    setSubjects(sb ?? [])
    setLoading(false)
  }

  async function selectExam(exam: any) {
    setSelectedExam(exam); setSelectedStudent(null)
    const { data } = await supabase
      .from('exam_results')
      .select('*, profiles(id, full_name, grade_level), subjects(id, name, color, section)')
      .eq('exam_id', exam.id)
      .order('net', { ascending: false })
    setExamResults(data ?? [])

    // Ranking hesapla ve güncelle
    const studentNets: Record<string, number> = {}
    for (const r of data ?? []) {
      const sid = r.student_id
      if (!studentNets[sid]) studentNets[sid] = 0
      studentNets[sid] += r.net
    }
    const sorted = Object.entries(studentNets).sort((a, b) => b[1] - a[1])
    for (let i = 0; i < sorted.length; i++) {
      const [sid, net] = sorted[i]
      const rank = i + 1
      const percentile = Math.round((1 - i / sorted.length) * 100)
      await supabase.from('exam_results')
        .update({ rank_in_exam: rank, percentile })
        .eq('exam_id', exam.id)
        .eq('student_id', sid)
    }

    // Güncel veriyi yeniden çek
    const { data: updated } = await supabase
      .from('exam_results')
      .select('*, profiles(id, full_name, grade_level), subjects(id, name, color, section)')
      .eq('exam_id', exam.id)
      .order('net', { ascending: false })
    setExamResults(updated ?? [])
  }

  async function selectStudent(student: any) {
    setSelectedStudent(student); setSelectedExam(null)
    const { data } = await supabase
      .from('exam_results')
      .select('*, exams(id, name, exam_date, exam_type), subjects(id, name, color, section)')
      .eq('student_id', student.id)
      .order('created_at', { ascending: true })
    setAllResults(data ?? [])
  }

  // Sınav bazlı öğrenci grupları
  const examStudentGroups = examResults.reduce((acc: any, r: any) => {
    const sid = r.student_id
    if (!acc[sid]) acc[sid] = { profile: r.profiles, subjects: [], totalNet: 0, rank: r.rank_in_exam, percentile: r.percentile }
    acc[sid].subjects.push(r)
    acc[sid].totalNet += r.net
    return acc
  }, {})

  const rankedStudents = Object.values(examStudentGroups)
    .sort((a: any, b: any) => b.totalNet - a.totalNet) as any[]

  // Öğrenci bazlı sınav grupları
  const studentExamGroups = allResults.reduce((acc: any, r: any) => {
    const key = r.exam_id
    if (!acc[key]) acc[key] = { exam: r.exams, subjects: [], totalNet: 0, rank: r.rank_in_exam, percentile: r.percentile }
    acc[key].subjects.push(r)
    acc[key].totalNet += r.net
    return acc
  }, {})
  const studentExamList = Object.values(studentExamGroups)
    .sort((a: any, b: any) => new Date(a.exam?.exam_date).getTime() - new Date(b.exam?.exam_date).getTime()) as any[]

  // Ders bazlı ortalamalar (öğrenci)
  const subjectAvgs = allResults.reduce((acc: any, r: any) => {
    const name = r.subjects?.name ?? 'Diğer'
    const section = r.subjects?.section ?? 'DİĞER'
    if (!acc[name]) acc[name] = { nets: [], color: r.subjects?.color, section }
    acc[name].nets.push(r.net)
    return acc
  }, {})

  const avg = (arr: number[]) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 10) / 10 : 0
  const allNets = studentExamList.map((e: any) => e.totalNet)
  const overallAvg = avg(allNets)
  const last5Avg = avg(allNets.slice(-5))
  const lastNet = allNets[allNets.length - 1] ?? 0
  const trend = last5Avg > overallAvg ? 'up' : last5Avg < overallAvg ? 'down' : 'stable'

  const sections = ['SAYISAL', 'SÖZEL', 'DİL', 'DİN']
  const sectionColors: Record<string, string> = {
    'SAYISAL': '#1B3A6B', 'SÖZEL': '#2E7D52', 'DİL': '#0F7070', 'DİN': '#B45309'
  }
  const sectionBgs: Record<string, string> = {
    'SAYISAL': '#EEF3FB', 'SÖZEL': '#DCFCE7', 'DİL': '#CCFBF1', 'DİN': '#FEF3C7'
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#7A8FA8' }}>Yükleniyor...</div>

  return (
    <div style={{ padding: '20px 16px', maxWidth: '1300px', fontFamily: '-apple-system,BlinkMacSystemFont,sans-serif' }}>

      {/* Başlık */}
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', margin: 0 }}>Sınav Analitik Merkezi</h1>
          <p style={{ fontSize: '12px', color: '#94A3B8', margin: '3px 0 0' }}>Puan analizi, sıralama ve SWOT</p>
        </div>
        <div style={{ display: 'flex', gap: '6px', background: '#F0F4F9', borderRadius: '8px', padding: '3px' }}>
          {(['exam', 'student'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              style={{ padding: '7px 16px', borderRadius: '6px', border: 'none', background: view === v ? '#fff' : 'transparent', color: view === v ? '#1B3A6B' : '#94A3B8', fontSize: '12px', fontWeight: view === v ? 700 : 500, cursor: 'pointer', boxShadow: view === v ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
              {v === 'exam' ? 'Sınav Bazlı' : 'Öğrenci Bazlı'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '16px' }}>

        {/* Sol panel */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: '12px', fontWeight: 700, color: '#475569' }}>
            {view === 'exam' ? `Sınavlar (${exams.length})` : `Öğrenciler (${students.length})`}
          </div>
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {view === 'exam' ? exams.map(e => (
              <div key={e.id} onClick={() => selectExam(e)}
                style={{ padding: '10px 14px', borderBottom: '1px solid #F8FAFC', cursor: 'pointer', background: selectedExam?.id === e.id ? '#EEF3FB' : '#fff', borderLeft: selectedExam?.id === e.id ? '3px solid #1B3A6B' : '3px solid transparent' }}>
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#1B3A6B' }}>{e.name}</div>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>{e.exam_date ? new Date(e.exam_date).toLocaleDateString('tr-TR') : '—'} · {e.exam_type ?? 'Deneme'}</div>
              </div>
            )) : students.map(s => (
              <div key={s.id} onClick={() => selectStudent(s)}
                style={{ padding: '10px 14px', borderBottom: '1px solid #F8FAFC', cursor: 'pointer', background: selectedStudent?.id === s.id ? '#EEF3FB' : '#fff', borderLeft: selectedStudent?.id === s.id ? '3px solid #1B3A6B' : '3px solid transparent' }}>
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#1B3A6B' }}>{s.full_name}</div>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>{s.grade_level ? s.grade_level + '. Sınıf' : '—'}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Sağ panel */}
        <div>
          {/* ── SINAV BAZLI ── */}
          {view === 'exam' && !selectedExam && (
            <div style={{ background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '48px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>📊</div>
              <div style={{ fontSize: '14px', color: '#94A3B8' }}>Sol listeden sınav seçin</div>
            </div>
          )}

          {view === 'exam' && selectedExam && (
            <div>
              {/* Sınav başlık */}
              <div style={{ background: '#1B3A6B', borderRadius: '12px', padding: '16px 18px', marginBottom: '12px' }}>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>{selectedExam.name}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginTop: '3px' }}>
                  {selectedExam.exam_date ? new Date(selectedExam.exam_date).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—'} · {rankedStudents.length} öğrenci
                </div>
              </div>

              {/* Genel sıralama */}
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', marginBottom: '14px' }}>
                <div style={{ padding: '10px 16px', borderBottom: '1px solid #F1F5F9', fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>
                  🏆 Genel Sıralama
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC' }}>
                        <th style={{ padding: '8px 14px', textAlign: 'left', color: '#475569', fontSize: '11px', fontWeight: 700 }}>Sıra</th>
                        <th style={{ padding: '8px 14px', textAlign: 'left', color: '#475569', fontSize: '11px', fontWeight: 700 }}>Öğrenci</th>
                        <th style={{ padding: '8px 14px', textAlign: 'right', color: '#475569', fontSize: '11px', fontWeight: 700 }}>Top. Net</th>
                        <th style={{ padding: '8px 14px', textAlign: 'right', color: '#475569', fontSize: '11px', fontWeight: 700 }}>Yüzdelik</th>
                        {sections.map(sec => (
                          <th key={sec} style={{ padding: '8px 14px', textAlign: 'right', color: sectionColors[sec], fontSize: '11px', fontWeight: 700 }}>{sec}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rankedStudents.map((s: any, i: number) => {
                        const sectionNets: Record<string, number> = {}
                        sections.forEach(sec => { sectionNets[sec] = 0 })
                        s.subjects.forEach((r: any) => {
                          const sec = r.subjects?.section ?? 'DİĞER'
                          if (sectionNets[sec] !== undefined) sectionNets[sec] += r.net
                        })
                        const rank = i + 1
                        return (
                          <tr key={s.profile?.id} style={{ borderBottom: '1px solid #F8FAFC', background: i % 2 === 0 ? '#fff' : '#FAFBFC' }}>
                            <td style={{ padding: '10px 14px' }}>
                              <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: rank <= 3 ? ['#FFD700','#C0C0C0','#CD7F32'][rank-1] : '#EEF3FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, color: rank <= 3 ? '#fff' : '#1B3A6B' }}>
                                {rank}
                              </div>
                            </td>
                            <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1B3A6B' }}>{s.profile?.full_name}</td>
                            <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#1B3A6B', fontSize: '14px' }}>{s.totalNet.toFixed(1)}</td>
                            <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                              <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', background: s.percentile >= 75 ? '#DCFCE7' : s.percentile >= 50 ? '#EEF3FB' : '#FEF2F2', color: s.percentile >= 75 ? '#14532D' : s.percentile >= 50 ? '#1B3A6B' : '#DC2626' }}>
                                %{s.percentile}
                              </span>
                            </td>
                            {sections.map(sec => (
                              <td key={sec} style={{ padding: '10px 14px', textAlign: 'right', color: sectionColors[sec], fontWeight: 600 }}>
                                {sectionNets[sec].toFixed(1)}
                              </td>
                            ))}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Ders bazlı ortalamalar */}
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                <div style={{ padding: '10px 16px', borderBottom: '1px solid #F1F5F9', fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>
                  📚 Ders Bazlı Sınıf Ortalamaları
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '1px', background: '#F1F5F9' }}>
                  {sections.map(sec => {
                    const secResults = examResults.filter((r: any) => r.subjects?.section === sec)
                    const secSubjects = [...new Set(secResults.map((r: any) => r.subjects?.name))].filter(Boolean)
                    return (
                      <div key={sec} style={{ background: '#fff', padding: '14px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: sectionColors[sec], background: sectionBgs[sec], display: 'inline-block', padding: '2px 10px', borderRadius: '10px', marginBottom: '10px' }}>{sec}</div>
                        {secSubjects.map((subName: any) => {
                          const subNets = secResults.filter((r: any) => r.subjects?.name === subName).map((r: any) => r.net)
                          const subAvg = avg(subNets)
                          const maxNet = Math.max(...subNets)
                          const minNet = Math.min(...subNets)
                          return (
                            <div key={subName} style={{ marginBottom: '8px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                                <span style={{ color: '#475569', fontWeight: 600 }}>{subName}</span>
                                <span style={{ color: sectionColors[sec], fontWeight: 700 }}>Ort: {subAvg}</span>
                              </div>
                              <div style={{ display: 'flex', gap: '8px', fontSize: '10px', color: '#94A3B8' }}>
                                <span>En Yüksek: {maxNet.toFixed(1)}</span>
                                <span>En Düşük: {minNet.toFixed(1)}</span>
                              </div>
                            </div>
                          )
                        })}
                        {secSubjects.length === 0 && <div style={{ fontSize: '12px', color: '#94A3B8' }}>Veri yok</div>}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── ÖĞRENCİ BAZLI ── */}
          {view === 'student' && !selectedStudent && (
            <div style={{ background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '48px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>👤</div>
              <div style={{ fontSize: '14px', color: '#94A3B8' }}>Sol listeden öğrenci seçin</div>
            </div>
          )}

          {view === 'student' && selectedStudent && (
            <div>
              {/* Öğrenci başlık */}
              <div style={{ background: '#1B3A6B', borderRadius: '12px', padding: '16px 18px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                  {selectedStudent.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>{selectedStudent.full_name}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>{studentExamList.length} sınav · Genel Ort: {overallAvg} net</div>
                </div>
                <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.15)', borderRadius: '10px', padding: '8px 16px' }}>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>{lastNet.toFixed(1)}</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>Son Sınav</div>
                </div>
                <div style={{ textAlign: 'center', background: trend === 'up' ? '#DCFCE7' : trend === 'down' ? '#FEF2F2' : 'rgba(255,255,255,0.15)', borderRadius: '10px', padding: '8px 16px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: trend === 'up' ? '#14532D' : trend === 'down' ? '#DC2626' : '#fff' }}>
                    {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
                  </div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>Trend</div>
                </div>
              </div>

              {/* Özet metrikler */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '14px' }}>
                {[
                  { label: 'Toplam Sınav', value: studentExamList.length, color: '#1B3A6B', bg: '#EEF3FB' },
                  { label: 'Genel Ortalama', value: overallAvg.toFixed(1), color: '#2E7D52', bg: '#DCFCE7' },
                  { label: 'Son 5 Ort.', value: avg(allNets.slice(-5)).toFixed(1), color: '#B45309', bg: '#FEF3C7' },
                  { label: 'En Yüksek', value: Math.max(...allNets, 0).toFixed(1), color: '#6B4FC8', bg: '#EDE9FE' },
                ].map(m => (
                  <div key={m.label} style={{ background: m.bg, borderRadius: '10px', padding: '12px 14px', textAlign: 'center' }}>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: m.color }}>{m.value}</div>
                    <div style={{ fontSize: '10px', color: m.color, opacity: 0.7, marginTop: '3px' }}>{m.label}</div>
                  </div>
                ))}
              </div>

              {/* Sınav geçmişi tablosu */}
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', marginBottom: '14px' }}>
                <div style={{ padding: '10px 16px', borderBottom: '1px solid #F1F5F9', fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>
                  📋 Sınav Geçmişi & Sıralama
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC' }}>
                        <th style={{ padding: '8px 14px', textAlign: 'left', color: '#475569', fontSize: '11px', fontWeight: 700 }}>Sınav</th>
                        <th style={{ padding: '8px 14px', textAlign: 'left', color: '#475569', fontSize: '11px', fontWeight: 700 }}>Tarih</th>
                        <th style={{ padding: '8px 14px', textAlign: 'right', color: '#475569', fontSize: '11px', fontWeight: 700 }}>Top. Net</th>
                        <th style={{ padding: '8px 14px', textAlign: 'right', color: '#475569', fontSize: '11px', fontWeight: 700 }}>Sıra</th>
                        <th style={{ padding: '8px 14px', textAlign: 'right', color: '#475569', fontSize: '11px', fontWeight: 700 }}>Yüzdelik</th>
                        {sections.map(sec => (
                          <th key={sec} style={{ padding: '8px 14px', textAlign: 'right', color: sectionColors[sec], fontSize: '11px', fontWeight: 700 }}>{sec}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {studentExamList.map((e: any, i: number) => {
                        const sectionNets: Record<string, number> = {}
                        sections.forEach(sec => { sectionNets[sec] = 0 })
                        e.subjects.forEach((r: any) => {
                          const sec = r.subjects?.section ?? 'DİĞER'
                          if (sectionNets[sec] !== undefined) sectionNets[sec] += r.net
                        })
                        const prevNet = i > 0 ? studentExamList[i - 1].totalNet : null
                        const change = prevNet !== null ? e.totalNet - prevNet : null
                        return (
                          <tr key={e.exam?.id} style={{ borderBottom: '1px solid #F8FAFC', background: i % 2 === 0 ? '#fff' : '#FAFBFC' }}>
                            <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1B3A6B' }}>{e.exam?.name}</td>
                            <td style={{ padding: '10px 14px', color: '#94A3B8' }}>{e.exam?.exam_date ? new Date(e.exam.exam_date).toLocaleDateString('tr-TR') : '—'}</td>
                            <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                              <div style={{ fontWeight: 700, color: '#1B3A6B', fontSize: '14px' }}>{e.totalNet.toFixed(1)}</div>
                              {change !== null && (
                                <div style={{ fontSize: '10px', color: change > 0 ? '#14532D' : change < 0 ? '#DC2626' : '#94A3B8', fontWeight: 600 }}>
                                  {change > 0 ? '+' : ''}{change.toFixed(1)}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                              {e.rank ? (
                                <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: e.rank <= 3 ? ['#FFD700','#C0C0C0','#CD7F32'][e.rank-1] : '#EEF3FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, color: e.rank <= 3 ? '#fff' : '#1B3A6B', marginLeft: 'auto' }}>
                                  {e.rank}
                                </div>
                              ) : <span style={{ color: '#94A3B8' }}>—</span>}
                            </td>
                            <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                              {e.percentile ? (
                                <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', background: e.percentile >= 75 ? '#DCFCE7' : e.percentile >= 50 ? '#EEF3FB' : '#FEF2F2', color: e.percentile >= 75 ? '#14532D' : e.percentile >= 50 ? '#1B3A6B' : '#DC2626' }}>
                                  %{e.percentile}
                                </span>
                              ) : <span style={{ color: '#94A3B8' }}>—</span>}
                            </td>
                            {sections.map(sec => (
                              <td key={sec} style={{ padding: '10px 14px', textAlign: 'right', color: sectionColors[sec], fontWeight: 600 }}>
                                {sectionNets[sec].toFixed(1)}
                              </td>
                            ))}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Ders bazlı SWOT */}
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                <div style={{ padding: '10px 16px', borderBottom: '1px solid #F1F5F9', fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>
                  🔍 Ders Bazlı SWOT Analizi
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '1px', background: '#F1F5F9' }}>
                  {sections.map(sec => {
                    const secSubjects = Object.entries(subjectAvgs)
                      .filter(([, v]: any) => v.section === sec)
                      .map(([name, v]: any) => ({ name, avg: avg(v.nets), color: v.color }))
                      .sort((a, b) => b.avg - a.avg)

                    return (
                      <div key={sec} style={{ background: '#fff', padding: '14px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: sectionColors[sec], background: sectionBgs[sec], display: 'inline-block', padding: '2px 10px', borderRadius: '10px', marginBottom: '10px' }}>{sec}</div>
                        {secSubjects.map(sub => {
                          const isStrong = sub.avg >= 70
                          const isWeak = sub.avg < 40
                          return (
                            <div key={sub.name} style={{ marginBottom: '8px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>{sub.name}</span>
                                  {isStrong && <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 6px', borderRadius: '8px', background: '#DCFCE7', color: '#14532D' }}>GÜÇLÜ</span>}
                                  {isWeak && <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 6px', borderRadius: '8px', background: '#FEF2F2', color: '#DC2626' }}>GELİŞTİR</span>}
                                </div>
                                <span style={{ fontSize: '13px', fontWeight: 800, color: isStrong ? '#14532D' : isWeak ? '#DC2626' : '#B45309' }}>
                                  {sub.avg.toFixed(1)}
                                </span>
                              </div>
                              <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: Math.min(sub.avg, 100) + '%', background: isStrong ? '#10B981' : isWeak ? '#DC2626' : '#D97706', borderRadius: '3px' }} />
                              </div>
                            </div>
                          )
                        })}
                        {secSubjects.length === 0 && <div style={{ fontSize: '12px', color: '#94A3B8' }}>Veri yok</div>}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}