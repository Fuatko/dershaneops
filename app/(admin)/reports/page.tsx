'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

function localDate(d: Date = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

export default function ReportsPage() {
  const [students, setStudents]     = useState<any[]>([])
  const [subjects, setSubjects]     = useState<any[]>([])
  const [loading, setLoading]       = useState(true)
  const [generating, setGenerating] = useState(false)
  const [activeReport, setActiveReport] = useState<string | null>(null)
  const [reportData, setReportData] = useState<any>(null)
  const [filterClass, setFilterClass]     = useState('')
  const [filterStudent, setFilterStudent] = useState('')
  const [filterSubject, setFilterSubject] = useState('')
  const [dateFrom, setDateFrom] = useState(localDate(new Date(Date.now() - 30*24*60*60*1000)))
  const [dateTo, setDateTo]     = useState(localDate())
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: s }, { data: sub }] = await Promise.all([
      supabase.from('profiles').select('id, full_name, grade_level, classroom_id').eq('role', 'student').order('grade_level'),
      supabase.from('subjects').select('*').order('name'),
    ])
    const { data: classrooms } = await supabase.from('classrooms').select('id, name')
    const classMap: Record<string,string> = {}
    for (const c of classrooms ?? []) classMap[c.id] = c.name
    setStudents((s ?? []).map((st: any) => ({ ...st, classroom_name: st.classroom_id ? classMap[st.classroom_id] : null })))
    setSubjects(sub ?? [])
    setLoading(false)
  }

  async function generateReport(
    type: string,
    cls  = filterClass,
    std  = filterStudent,
    subj = filterSubject,
    from = dateFrom,
    to   = dateTo,
  ) {
    setGenerating(true); setActiveReport(type); setReportData(null)

    // Sınıf + öğrenci filtresi → ID listesi
    let studentIds: string[] = []
    if (std) {
      studentIds = [std]
    } else if (cls) {
      studentIds = students.filter(s => String(s.grade_level) === cls).map(s => s.id)
    }

    if (type === 'performance') {
      let query = supabase
        .from('student_topic_performance')
        .select('*, profiles!student_topic_performance_student_id_fkey(full_name, grade_level), subjects(name), topics(name)')
        .order('accuracy_rate', { ascending: true })
      if (studentIds.length > 0) query = query.in('student_id', studentIds)
      if (subj) query = query.eq('subject_id', subj)
      const { data } = await query
      setReportData(data ?? [])
    }

    if (type === 'homework') {
      let query = supabase
        .from('homework_assignments')
        .select('*, profiles!homework_assignments_student_id_fkey(full_name, grade_level), tests(name, chapters(name, books(name)))')
        .order('created_at', { ascending: false })
      if (studentIds.length > 0) query = query.in('student_id', studentIds)
      const { data } = await query
      setReportData(data ?? [])
    }

    if (type === 'attendance') {
      let query = supabase
        .from('study_calendar')
        .select('*, profiles!study_calendar_student_id_fkey(full_name, grade_level), subjects(name)')
        .gte('calendar_date', from)
        .lte('calendar_date', to)
        .order('calendar_date', { ascending: false })
      if (studentIds.length > 0) query = query.in('student_id', studentIds)
      const { data } = await query
      setReportData(data ?? [])
    }

    if (type === 'risk') {
      const targetStudents = studentIds.length > 0
        ? students.filter(s => studentIds.includes(s.id))
        : students
      const result = []
      for (const s of targetStudents.slice(0, 20)) {
        const { data: riskData } = await supabase.rpc('calculate_risk_score', { p_student_id: s.id })
        const { data: tp } = await supabase.from('student_topic_performance').select('accuracy_rate, total_questions').eq('student_id', s.id)
        const totalQ = (tp ?? []).reduce((sum: number, t: any) => sum + t.total_questions, 0)
        const totalC = (tp ?? []).reduce((sum: number, t: any) => sum + (t.total_questions * t.accuracy_rate / 100), 0)
        result.push({ ...s, risk_score: Math.round(riskData ?? 0), overall_rate: totalQ > 0 ? Math.round(totalC/totalQ*100) : 0 })
      }
      result.sort((a, b) => b.risk_score - a.risk_score)
      setReportData(result)
    }

    setGenerating(false)
  }

  function changeClass(cls: string) {
    setFilterClass(cls)
    setFilterStudent('')
    if (activeReport) generateReport(activeReport, cls, '', filterSubject)
  }

  function changeStudent(std: string) {
    setFilterStudent(std)
    if (activeReport) generateReport(activeReport, filterClass, std, filterSubject)
  }

  function changeSubject(subj: string) {
    setFilterSubject(subj)
    if (activeReport) generateReport(activeReport, filterClass, filterStudent, subj)
  }

  function changeDateFrom(from: string) {
    setDateFrom(from)
    if (activeReport) generateReport(activeReport, filterClass, filterStudent, filterSubject, from, dateTo)
  }

  function changeDateTo(to: string) {
    setDateTo(to)
    if (activeReport) generateReport(activeReport, filterClass, filterStudent, filterSubject, dateFrom, to)
  }

  function exportCSV() {
    if (!reportData || !activeReport) return
    let headers = '', rows: string[] = []
    if (activeReport === 'performance') {
      headers = 'Öğrenci,Sınıf,Ders,Konu,Başarı %,Toplam Soru,Doğru,Yanlış'
      rows = reportData.map((r: any) => `"${r.profiles?.full_name}","${r.profiles?.grade_level}. Sınıf","${r.subjects?.name}","${r.topics?.name ?? 'Genel'}","${Math.round(r.accuracy_rate)}","${r.total_questions}","${r.correct_count}","${r.wrong_count}"`)
    }
    if (activeReport === 'homework') {
      headers = 'Öğrenci,Sınıf,Test,Kitap,Durum'
      rows = reportData.map((r: any) => `"${r.profiles?.full_name}","${r.profiles?.grade_level}. Sınıf","${r.tests?.name}","${r.tests?.chapters?.books?.name ?? ''}","${r.status === 'completed' ? 'Tamamlandı' : 'Bekliyor'}"`)
    }
    if (activeReport === 'attendance') {
      headers = 'Öğrenci,Sınıf,Tarih,Görev,Ders,Süre,Durum'
      rows = reportData.map((r: any) => `"${r.profiles?.full_name}","${r.profiles?.grade_level}. Sınıf","${r.calendar_date}","${r.title}","${r.subjects?.name ?? ''}","${r.duration_minutes} dk","${r.status === 'completed' ? 'Tamamlandı' : 'Bekliyor'}"`)
    }
    if (activeReport === 'risk') {
      headers = 'Öğrenci,Sınıf,Risk Skoru,Genel Başarı'
      rows = reportData.map((r: any) => `"${r.full_name}","${r.grade_level}. Sınıf","${r.risk_score}","${r.overall_rate}%"`)
    }
    const csv = [headers, ...rows].join('\n')
    const blob = new Blob(['\uFEFF'+csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `dershaneops_${activeReport}_${localDate()}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const grades = [...new Set(students.filter(s => s.grade_level).map(s => s.grade_level))].sort()
  const filteredStudents = students.filter(s => !filterClass || String(s.grade_level) === filterClass)

  const REPORTS = [
    { id:'performance', label:'Performans Raporu', icon:'📊', desc:'Konu bazlı başarı oranları', color:'#1B3A6B', bg:'#EEF3FB' },
    { id:'homework',    label:'Ödev Raporu',        icon:'📚', desc:'Ödev tamamlama durumları',  color:'#14532D', bg:'#DCFCE7' },
    { id:'attendance',  label:'Devam Raporu',       icon:'📅', desc:'Takvim görev tamamlama',   color:'#78350F', bg:'#FEF3C7' },
    { id:'risk',        label:'Risk Raporu',        icon:'🚨', desc:'Öğrenci risk skorları',     color:'#7F1D1D', bg:'#FEF2F2' },
  ]

  if (loading) return <div style={{ padding:'40px', textAlign:'center', color:'#94A3B8' }}>Yükleniyor...</div>

  return (
    <div style={{ padding:'20px 16px', maxWidth:'1200px', fontFamily:'-apple-system, BlinkMacSystemFont, "Inter", sans-serif' }}>

      <div style={{ marginBottom:'20px' }}>
        <h1 style={{ fontSize:'20px', fontWeight:700, color:'#1B3A6B', margin:0 }}>Raporlar & Export</h1>
        <p style={{ fontSize:'13px', color:'#94A3B8', margin:'4px 0 0' }}>Akademik veriler — CSV export</p>
      </div>

      {/* Rapor tipleri */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'10px', marginBottom:'16px' }} className="reports-grid">
        {REPORTS.map(r => (
          <button key={r.id} onClick={() => generateReport(r.id)}
            style={{ padding:'14px 16px', borderRadius:'12px', border:`2px solid ${activeReport===r.id ? r.color : '#E2E8F0'}`, background: activeReport===r.id ? r.bg : '#fff', cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:'12px' }}>
            <div style={{ fontSize:'24px', flexShrink:0 }}>{r.icon}</div>
            <div>
              <div style={{ fontSize:'13px', fontWeight:700, color: activeReport===r.id ? r.color : '#1B3A6B' }}>{r.label}</div>
              <div style={{ fontSize:'11px', color:'#94A3B8', marginTop:'2px' }}>{r.desc}</div>
            </div>
            {activeReport===r.id && generating && (
              <div style={{ marginLeft:'auto', fontSize:'11px', color:r.color }}>Yükleniyor...</div>
            )}
          </button>
        ))}
      </div>

      {/* Filtreler */}
      <div style={{ background:'#fff', borderRadius:'10px', padding:'14px', marginBottom:'14px', border:'1px solid #E2E8F0' }}>
        <div style={{ fontSize:'11px', fontWeight:600, color:'#475569', textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:'10px' }}>
          Filtreler {!activeReport && <span style={{ fontWeight:400, color:'#94A3B8', textTransform:'none', letterSpacing:0 }}>— önce rapor tipi seçin</span>}
        </div>

        {/* Sınıf butonları */}
        <div style={{ marginBottom:'10px' }}>
          <div style={{ fontSize:'11px', color:'#94A3B8', marginBottom:'6px' }}>Sınıf</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
            <button
              onClick={() => changeClass('')}
              style={{ padding:'4px 10px', borderRadius:'20px', border:'1.5px solid', borderColor:filterClass===''?'#1B3A6B':'#E2E8F0', background:filterClass===''?'#1B3A6B':'#fff', color:filterClass===''?'#fff':'#475569', fontSize:'11px', fontWeight:600, cursor:'pointer' }}>
              Tümü
            </button>
            {grades.map(g => (
              <button key={g}
                onClick={() => changeClass(String(g))}
                style={{ padding:'4px 10px', borderRadius:'20px', border:'1.5px solid', borderColor:filterClass===String(g)?'#1B3A6B':'#E2E8F0', background:filterClass===String(g)?'#1B3A6B':'#fff', color:filterClass===String(g)?'#fff':'#475569', fontSize:'11px', fontWeight:600, cursor:'pointer' }}>
                {g}. Sınıf
              </button>
            ))}
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px' }} className="filter-grid">
          <div>
            <div style={{ fontSize:'11px', color:'#94A3B8', marginBottom:'5px' }}>Öğrenci</div>
            <select value={filterStudent} onChange={e => changeStudent(e.target.value)}
              style={{ width:'100%', padding:'8px 10px', borderRadius:'7px', border:'1px solid #E2E8F0', fontSize:'12px', outline:'none', background:'#fff', color:'#1E293B' }}>
              <option value="">Tüm Öğrenciler</option>
              {filteredStudents.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize:'11px', color:'#94A3B8', marginBottom:'5px' }}>Ders</div>
            <select value={filterSubject} onChange={e => changeSubject(e.target.value)}
              style={{ width:'100%', padding:'8px 10px', borderRadius:'7px', border:'1px solid #E2E8F0', fontSize:'12px', outline:'none', background:'#fff', color:'#1E293B' }}>
              <option value="">Tüm Dersler</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize:'11px', color:'#94A3B8', marginBottom:'5px' }}>Tarih Aralığı</div>
            <div style={{ display:'flex', gap:'4px' }}>
              <input type="date" value={dateFrom} onChange={e => changeDateFrom(e.target.value)}
                style={{ flex:1, padding:'8px 6px', borderRadius:'7px', border:'1px solid #E2E8F0', fontSize:'11px', outline:'none' }} />
              <input type="date" value={dateTo} onChange={e => changeDateTo(e.target.value)}
                style={{ flex:1, padding:'8px 6px', borderRadius:'7px', border:'1px solid #E2E8F0', fontSize:'11px', outline:'none' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Yükleniyor */}
      {generating && (
        <div style={{ background:'#EEF3FB', borderRadius:'10px', padding:'24px', textAlign:'center', border:'1px solid #BFDBFE' }}>
          <div style={{ fontSize:'13px', color:'#1B3A6B', fontWeight:600 }}>Rapor oluşturuluyor...</div>
        </div>
      )}

      {/* Sonuçlar */}
      {reportData && !generating && (
        <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', overflow:'hidden' }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid #F1F5F9', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B' }}>
                {REPORTS.find(r => r.id === activeReport)?.label}
                {filterClass && <span style={{ marginLeft:'8px', fontSize:'11px', fontWeight:600, padding:'1px 8px', borderRadius:'10px', background:'#EEF3FB', color:'#1B3A6B' }}>{filterClass}. Sınıf</span>}
                {filterStudent && <span style={{ marginLeft:'4px', fontSize:'11px', fontWeight:600, padding:'1px 8px', borderRadius:'10px', background:'#DCFCE7', color:'#14532D' }}>{students.find(s=>s.id===filterStudent)?.full_name}</span>}
              </div>
              <div style={{ fontSize:'11px', color:'#94A3B8' }}>{reportData.length} kayıt</div>
            </div>
            <button onClick={exportCSV}
              style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 14px', borderRadius:'8px', background:'#1B3A6B', color:'#fff', fontSize:'12px', fontWeight:600, border:'none', cursor:'pointer' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              CSV İndir
            </button>
          </div>

          <div style={{ overflowX:'auto' }}>
            {activeReport === 'performance' && (
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'12px' }}>
                <thead>
                  <tr style={{ background:'#F8FAFC' }}>
                    {['Öğrenci','Sınıf','Ders','Konu','Başarı','Soru','D','Y','B'].map(h => (
                      <th key={h} style={{ padding:'9px 12px', textAlign:'left', fontSize:'11px', fontWeight:700, color:'#475569', borderBottom:'1px solid #E2E8F0', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((r: any, i: number) => {
                    const rate = Math.round(r.accuracy_rate)
                    const color = rate>=70?'#14532D':rate>=50?'#78350F':'#7F1D1D'
                    const bg    = rate>=70?'#DCFCE7':rate>=50?'#FEF3C7':'#FEF2F2'
                    return (
                      <tr key={i} style={{ borderBottom:'1px solid #F8FAFC' }}>
                        <td style={{ padding:'9px 12px', fontWeight:600, color:'#1B3A6B' }}>{r.profiles?.full_name}</td>
                        <td style={{ padding:'9px 12px', color:'#475569' }}>{r.profiles?.grade_level}. Sınıf</td>
                        <td style={{ padding:'9px 12px', color:'#475569' }}>{r.subjects?.name}</td>
                        <td style={{ padding:'9px 12px', color:'#475569' }}>{r.topics?.name ?? 'Genel'}</td>
                        <td style={{ padding:'9px 12px' }}><span style={{ padding:'2px 8px', borderRadius:'10px', background:bg, color, fontWeight:700, fontSize:'11px' }}>%{rate}</span></td>
                        <td style={{ padding:'9px 12px', color:'#475569' }}>{r.total_questions}</td>
                        <td style={{ padding:'9px 12px', color:'#14532D', fontWeight:600 }}>{r.correct_count}</td>
                        <td style={{ padding:'9px 12px', color:'#7F1D1D', fontWeight:600 }}>{r.wrong_count}</td>
                        <td style={{ padding:'9px 12px', color:'#475569' }}>{r.blank_count}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}

            {activeReport === 'homework' && (
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'12px' }}>
                <thead>
                  <tr style={{ background:'#F8FAFC' }}>
                    {['Öğrenci','Sınıf','Test','Kitap','Durum'].map(h => (
                      <th key={h} style={{ padding:'9px 12px', textAlign:'left', fontSize:'11px', fontWeight:700, color:'#475569', borderBottom:'1px solid #E2E8F0' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((r: any, i: number) => {
                    const isDone = r.status === 'completed'
                    const isLate = !isDone && r.deadline && new Date(r.deadline) < new Date()
                    return (
                      <tr key={i} style={{ borderBottom:'1px solid #F8FAFC' }}>
                        <td style={{ padding:'9px 12px', fontWeight:600, color:'#1B3A6B' }}>{r.profiles?.full_name}</td>
                        <td style={{ padding:'9px 12px', color:'#475569' }}>{r.profiles?.grade_level}. Sınıf</td>
                        <td style={{ padding:'9px 12px', color:'#475569' }}>{r.tests?.name}</td>
                        <td style={{ padding:'9px 12px', color:'#475569' }}>{r.tests?.chapters?.books?.name ?? '—'}</td>
                        <td style={{ padding:'9px 12px' }}>
                          <span style={{ padding:'2px 8px', borderRadius:'10px', fontSize:'11px', fontWeight:700, background:isDone?'#DCFCE7':isLate?'#FEF2F2':'#FEF3C7', color:isDone?'#14532D':isLate?'#7F1D1D':'#78350F' }}>
                            {isDone ? 'Tamamlandı' : isLate ? 'Gecikti' : 'Bekliyor'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}

            {activeReport === 'attendance' && (
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'12px' }}>
                <thead>
                  <tr style={{ background:'#F8FAFC' }}>
                    {['Öğrenci','Sınıf','Tarih','Görev','Ders','Süre','Durum'].map(h => (
                      <th key={h} style={{ padding:'9px 12px', textAlign:'left', fontSize:'11px', fontWeight:700, color:'#475569', borderBottom:'1px solid #E2E8F0', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((r: any, i: number) => {
                    const isDone = r.status === 'completed'
                    return (
                      <tr key={i} style={{ borderBottom:'1px solid #F8FAFC', background:isDone?'#F0FDF4':'#fff' }}>
                        <td style={{ padding:'9px 12px', fontWeight:600, color:'#1B3A6B' }}>{r.profiles?.full_name}</td>
                        <td style={{ padding:'9px 12px', color:'#475569' }}>{r.profiles?.grade_level}. Sınıf</td>
                        <td style={{ padding:'9px 12px', color:'#475569', whiteSpace:'nowrap' }}>{r.calendar_date}</td>
                        <td style={{ padding:'9px 12px', color:'#475569' }}>{r.title}</td>
                        <td style={{ padding:'9px 12px', color:'#475569' }}>{r.subjects?.name ?? '—'}</td>
                        <td style={{ padding:'9px 12px', color:'#475569' }}>{r.duration_minutes} dk</td>
                        <td style={{ padding:'9px 12px' }}>
                          <span style={{ padding:'2px 8px', borderRadius:'10px', fontSize:'11px', fontWeight:700, background:isDone?'#DCFCE7':'#FEF3C7', color:isDone?'#14532D':'#78350F' }}>
                            {isDone ? '✓ Tamam' : 'Bekliyor'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}

            {activeReport === 'risk' && (
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'12px' }}>
                <thead>
                  <tr style={{ background:'#F8FAFC' }}>
                    {['Sıra','Öğrenci','Sınıf','Risk Skoru','Genel Başarı','Risk Seviyesi'].map(h => (
                      <th key={h} style={{ padding:'9px 12px', textAlign:'left', fontSize:'11px', fontWeight:700, color:'#475569', borderBottom:'1px solid #E2E8F0', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((r: any, i: number) => {
                    const riskColor = r.risk_score>=70?'#7F1D1D':r.risk_score>=45?'#78350F':r.risk_score>=20?'#1B3A6B':'#14532D'
                    const riskBg    = r.risk_score>=70?'#FEF2F2':r.risk_score>=45?'#FEF3C7':r.risk_score>=20?'#EEF3FB':'#DCFCE7'
                    const riskLabel = r.risk_score>=70?'Kritik':r.risk_score>=45?'Yüksek':r.risk_score>=20?'Orta':'Düşük'
                    return (
                      <tr key={i} style={{ borderBottom:'1px solid #F8FAFC' }}>
                        <td style={{ padding:'9px 12px', color:'#94A3B8', fontWeight:600 }}>{i+1}</td>
                        <td style={{ padding:'9px 12px', fontWeight:600, color:'#1B3A6B' }}>{r.full_name}</td>
                        <td style={{ padding:'9px 12px', color:'#475569' }}>{r.grade_level}. Sınıf {r.classroom_name ? '· '+r.classroom_name : ''}</td>
                        <td style={{ padding:'9px 12px', fontWeight:700, color:riskColor, fontSize:'14px' }}>{r.risk_score}</td>
                        <td style={{ padding:'9px 12px', color:'#475569' }}>%{r.overall_rate}</td>
                        <td style={{ padding:'9px 12px' }}>
                          <span style={{ padding:'2px 10px', borderRadius:'10px', background:riskBg, color:riskColor, fontSize:'11px', fontWeight:700 }}>{riskLabel}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      <style>{`
        .reports-grid { grid-template-columns: repeat(2,1fr); }
        .filter-grid  { grid-template-columns: 1fr; }
        @media (min-width:768px) {
          .reports-grid { grid-template-columns: repeat(4,1fr); }
          .filter-grid  { grid-template-columns: 1fr 1fr 1fr; }
        }
      `}</style>
    </div>
  )
}