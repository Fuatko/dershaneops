'use client'
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// SVG ikonlar
const IcoStudent = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
const IcoTeacher = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
const IcoCalendar = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
const IcoBook = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
const IcoAlert = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>

export default function DashboardPage() {
  const [stats, setStats] = useState({ students:0, teachers:0, lessons:0, books:0 })
  const [allStudents, setAllStudents] = useState<any[]>([])
  const [upcomingLessons, setUpcomingLessons] = useState<any[]>([])
  const [riskStudents, setRiskStudents] = useState<any[]>([])
  const [selectedGrade, setSelectedGrade] = useState<number|'all'>('all')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const today = new Date()
    const [
      { count: studentCount },
      { count: teacherCount },
      { count: lessonCount },
      { count: bookCount },
      { data: students },
      { data: lessons },
      { data: classroomData },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count:'exact', head:true }).eq('role', 'student'),
      supabase.from('profiles').select('*', { count:'exact', head:true }).eq('role', 'teacher'),
      supabase.from('lessons').select('*', { count:'exact', head:true }),
      supabase.from('books').select('*', { count:'exact', head:true }),
      supabase.from('profiles').select('id, full_name, grade_level, classroom_id').eq('role', 'student').order('grade_level', { ascending:true }),
      supabase.from('lessons').select('id, subject, scheduled_at, profiles!lessons_student_id_fkey(id, full_name, grade_level, classroom_id)').eq('status', 'scheduled').gte('scheduled_at', today.toISOString()).order('scheduled_at').limit(8),
      supabase.from('classrooms').select('*').order('grade_level'),
    ])

    setStats({ students:studentCount??0, teachers:teacherCount??0, lessons:lessonCount??0, books:bookCount??0 })

    const classroomMap: Record<string,string> = {}
    for (const c of classroomData??[]) classroomMap[c.id] = c.name

    const studentsWithClass = (students??[]).map(s => ({ ...s, classroom_name: s.classroom_id ? classroomMap[s.classroom_id]??null : null }))
    setAllStudents(studentsWithClass)

    const lessonsWithClass = (lessons??[]).map(l => ({ ...l, student_classroom: (l.profiles as any)?.classroom_id ? classroomMap[(l.profiles as any).classroom_id]??null : null }))
    setUpcomingLessons(lessonsWithClass)

    const riskList: any[] = []
    for (const s of studentsWithClass.slice(0, 12)) {
      const { data: risk } = await supabase.rpc('calculate_risk_score', { p_student_id: s.id })
      if ((risk??0) >= 45) riskList.push({ ...s, risk_score: Math.round(risk??0) })
    }
    riskList.sort((a,b) => b.risk_score - a.risk_score)
    setRiskStudents(riskList.slice(0, 6))
    setLoading(false)
  }

  function getLevelStyle(grade: number) {
    if (grade <= 4) return { color:'#2E7D52', bg:'#DCFCE7', label:'İlkokul' }
    if (grade <= 8) return { color:'#1B3A6B', bg:'#EEF3FB', label:'Ortaokul' }
    return { color:'#6B4FC8', bg:'#EDE9FE', label:'Lise' }
  }

  const gradeGroups = allStudents.reduce((acc: any, s) => {
    const g = s.grade_level ?? 0
    if (!acc[g]) acc[g] = []
    acc[g].push(s)
    return acc
  }, {})

  const sortedGrades = Object.keys(gradeGroups).map(Number).sort((a,b) => a-b)
  const filteredStudents = selectedGrade === 'all' ? allStudents : (gradeGroups[selectedGrade]??[])

  const metrics = [
    { label:'Toplam Öğrenci', value:stats.students, color:'#1B3A6B', bg:'#EEF3FB', border:'#BFDBFE', href:'/students', Icon:IcoStudent },
    { label:'Toplam Öğretmen', value:stats.teachers, color:'#2E7D52', bg:'#DCFCE7', border:'#86EFAC', href:'/teachers', Icon:IcoTeacher },
    { label:'Toplam Ders', value:stats.lessons, color:'#92400E', bg:'#FEF3C7', border:'#FCD34D', href:'/scheduler', Icon:IcoCalendar },
    { label:'Toplam Kitap', value:stats.books, color:'#6B4FC8', bg:'#EDE9FE', border:'#C4B5FD', href:'/books', Icon:IcoBook },
  ]

  if (loading) return (
    <div style={{ display:'flex', height:'100%', alignItems:'center', justifyContent:'center', background:'#F8FAFC' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:'48px', height:'48px', borderRadius:'12px', background:'#EEF3FB', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', color:'#1B3A6B' }}><IcoCalendar /></div>
        <div style={{ fontSize:'13px', color:'#94A3B8' }}>Yükleniyor...</div>
      </div>
    </div>
  )

  return (
    <div style={{ padding:'20px 16px', maxWidth:'1300px', margin:'0 auto' }}>

      {/* Başlık */}
      <div style={{ marginBottom:'20px' }}>
        <h1 style={{ fontSize:'18px', fontWeight:800, color:'#1B3A6B', margin:0 }}>Dashboard</h1>
        <p style={{ fontSize:'12px', color:'#94A3B8', margin:'3px 0 0' }}>
          {new Date().toLocaleDateString('tr-TR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
        </p>
      </div>

      {/* Metrikler */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'10px', marginBottom:'16px' }} className="metrics-grid">
        {metrics.map(m => (
          <Link key={m.label} href={m.href} style={{ textDecoration:'none' }}>
            <div style={{ background:m.bg, borderRadius:'12px', padding:'14px 16px', border:'1px solid '+m.border, display:'flex', alignItems:'center', gap:'12px' }}>
              <div style={{ width:'40px', height:'40px', borderRadius:'10px', background:'rgba(255,255,255,0.7)', display:'flex', alignItems:'center', justifyContent:'center', color:m.color, flexShrink:0 }}>
                <m.Icon />
              </div>
              <div>
                <div style={{ fontSize:'26px', fontWeight:800, color:m.color, lineHeight:1 }}>{m.value}</div>
                <div style={{ fontSize:'11px', color:m.color, opacity:0.7, marginTop:'3px', fontWeight:600 }}>{m.label}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Sınıf Filtresi */}
      <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', marginBottom:'16px', overflow:'hidden' }}>
        <div style={{ padding:'12px 16px', borderBottom:'1px solid #F1F5F9', fontSize:'12px', fontWeight:700, color:'#1B3A6B' }}>
          Sınıfa Göre Filtrele
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', padding:'10px 12px' }}>
          <button onClick={() => setSelectedGrade('all')}
            style={{ padding:'5px 12px', borderRadius:'20px', border:'1.5px solid', borderColor:selectedGrade==='all'?'#1B3A6B':'#E2E8F0', background:selectedGrade==='all'?'#1B3A6B':'#fff', color:selectedGrade==='all'?'#fff':'#475569', fontSize:'11.5px', fontWeight:600, cursor:'pointer' }}>
            Tümü ({allStudents.length})
          </button>
          {sortedGrades.map(g => {
            const lv = getLevelStyle(g)
            const isSelected = selectedGrade === g
            return (
              <button key={g} onClick={() => setSelectedGrade(isSelected ? 'all' : g)}
                style={{ padding:'5px 12px', borderRadius:'20px', border:'1.5px solid', borderColor:isSelected?lv.color:'#E2E8F0', background:isSelected?lv.color:'#fff', color:isSelected?'#fff':lv.color, fontSize:'11.5px', fontWeight:600, cursor:'pointer' }}>
                {g}. Sınıf ({gradeGroups[g]?.length??0})
              </button>
            )
          })}
        </div>
      </div>

      {/* Öğrenciler + Dersler */}
      <div style={{ display:'grid', gap:'16px', marginBottom:'16px' }} className="two-col-grid">

        {/* Öğrenci Listesi */}
        <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', overflow:'hidden' }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid #F1F5F9', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B' }}>
              {selectedGrade==='all' ? `Tüm Öğrenciler` : `${selectedGrade}. Sınıf`}
              <span style={{ marginLeft:'6px', fontSize:'11px', fontWeight:600, padding:'1px 7px', borderRadius:'10px', background:'#EEF3FB', color:'#1B3A6B' }}>{filteredStudents.length}</span>
            </div>
            <Link href="/students" style={{ fontSize:'11px', color:'#1B3A6B', textDecoration:'none', fontWeight:600 }}>Tümü →</Link>
          </div>
          <div style={{ overflowY:'auto', maxHeight:'320px' }}>
            {filteredStudents.length===0 ? (
              <div style={{ padding:'28px', textAlign:'center', color:'#94A3B8', fontSize:'13px' }}>Bu sınıfta öğrenci yok</div>
            ) : filteredStudents.map((s: any, i: number) => {
              const lv = s.grade_level ? getLevelStyle(s.grade_level) : null
              return (
                <div key={s.id} style={{ padding:'10px 16px', borderBottom:i<filteredStudents.length-1?'1px solid #F8FAFC':'none', display:'flex', alignItems:'center', gap:'10px' }}>
                  <div style={{ width:'30px', height:'30px', borderRadius:'50%', background:lv?lv.bg:'#EEF3FB', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:700, color:lv?lv.color:'#1B3A6B', flexShrink:0 }}>
                    {s.full_name?.split(' ').map((n:string)=>n[0]).join('').slice(0,2)}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:'12.5px', fontWeight:600, color:'#1B3A6B', marginBottom:'2px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{s.full_name}</div>
                    <div style={{ display:'flex', gap:'4px', flexWrap:'wrap' }}>
                      {lv && s.grade_level && (
                        <span style={{ fontSize:'10px', fontWeight:700, padding:'1px 6px', borderRadius:'5px', background:lv.bg, color:lv.color }}>{s.grade_level}. Sınıf</span>
                      )}
                      {s.classroom_name && (
                        <span style={{ fontSize:'10px', padding:'1px 6px', borderRadius:'5px', background:'#F1F5F9', color:'#475569', fontWeight:600 }}>{s.classroom_name}</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Yaklaşan Dersler */}
        <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', overflow:'hidden' }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid #F1F5F9', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B' }}>
              Yaklaşan Dersler
              <span style={{ marginLeft:'6px', fontSize:'11px', fontWeight:600, padding:'1px 7px', borderRadius:'10px', background:'#EEF3FB', color:'#1B3A6B' }}>{upcomingLessons.length}</span>
            </div>
            <Link href="/scheduler" style={{ fontSize:'11px', color:'#1B3A6B', textDecoration:'none', fontWeight:600 }}>Takvim →</Link>
          </div>
          <div style={{ overflowY:'auto', maxHeight:'320px' }}>
            {upcomingLessons.length===0 ? (
              <div style={{ padding:'28px', textAlign:'center', color:'#94A3B8', fontSize:'13px' }}>Planlanmış ders yok</div>
            ) : upcomingLessons.map((l, i) => {
              const profile = l.profiles as any
              const lv = profile?.grade_level ? getLevelStyle(profile.grade_level) : null
              return (
                <div key={l.id} style={{ padding:'10px 16px', borderBottom:i<upcomingLessons.length-1?'1px solid #F8FAFC':'none', display:'flex', alignItems:'center', gap:'10px' }}>
                  <div style={{ width:'36px', height:'36px', borderRadius:'9px', background:'#EEF3FB', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <div style={{ fontSize:'11px', fontWeight:800, color:'#1B3A6B' }}>{new Date(l.scheduled_at).getDate()}</div>
                    <div style={{ fontSize:'8px', color:'#94A3B8' }}>{new Date(l.scheduled_at).toLocaleDateString('tr-TR', { month:'short' })}</div>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:'12.5px', fontWeight:700, color:'#1B3A6B', marginBottom:'2px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{l.subject}</div>
                    <div style={{ display:'flex', alignItems:'center', gap:'4px', flexWrap:'wrap' }}>
                      <span style={{ fontSize:'11px', color:'#94A3B8' }}>{profile?.full_name}</span>
                      {lv && profile?.grade_level && (
                        <span style={{ fontSize:'10px', fontWeight:700, padding:'1px 5px', borderRadius:'5px', background:lv.bg, color:lv.color }}>{profile.grade_level}. Sınıf</span>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize:'11px', color:'#94A3B8', flexShrink:0, fontWeight:600 }}>
                    {new Date(l.scheduled_at).toLocaleTimeString('tr-TR', { hour:'2-digit', minute:'2-digit' })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Risk Uyarıları */}
      {riskStudents.length > 0 && (
        <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #FECACA', overflow:'hidden' }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid #FEE2E2', background:'#FEF2F2', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'7px' }}>
              <span style={{ color:'#DC2626' }}><IcoAlert /></span>
              <div style={{ fontSize:'13px', fontWeight:700, color:'#DC2626' }}>Risk Uyarıları</div>
              <span style={{ fontSize:'11px', fontWeight:700, padding:'1px 7px', borderRadius:'10px', background:'#FEE2E2', color:'#DC2626' }}>{riskStudents.length} öğrenci</span>
            </div>
            <Link href="/risk" style={{ fontSize:'11px', color:'#DC2626', textDecoration:'none', fontWeight:600 }}>Risk Analizi →</Link>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))' }}>
            {riskStudents.map((s, i) => {
              const lv = s.grade_level ? getLevelStyle(s.grade_level) : null
              const riskColor = s.risk_score>=70 ? '#DC2626' : '#D97706'
              const riskBg = s.risk_score>=70 ? '#FEF2F2' : '#FEF3C7'
              return (
                <div key={s.id} style={{ padding:'12px 16px', borderRight:'1px solid #F1F5F9', borderBottom:'1px solid #F1F5F9', display:'flex', alignItems:'center', gap:'10px' }}>
                  <div style={{ width:'30px', height:'30px', borderRadius:'50%', background:riskBg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:700, color:riskColor, flexShrink:0 }}>
                    {s.full_name?.split(' ').map((n:string)=>n[0]).join('').slice(0,2)}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:'12px', fontWeight:600, color:'#1B3A6B', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{s.full_name}</div>
                    <div style={{ display:'flex', gap:'3px' }}>
                      {lv && s.grade_level && (
                        <span style={{ fontSize:'10px', fontWeight:700, padding:'1px 5px', borderRadius:'4px', background:lv.bg, color:lv.color }}>{s.grade_level}. Sınıf</span>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign:'center', flexShrink:0 }}>
                    <div style={{ fontSize:'18px', fontWeight:800, color:riskColor, lineHeight:1 }}>{s.risk_score}</div>
                    <div style={{ fontSize:'9px', color:'#94A3B8' }}>risk</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <style>{`
        @media (min-width: 768px) {
          .metrics-grid { grid-template-columns: repeat(4,1fr) !important; }
          .two-col-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 767px) {
          .metrics-grid { grid-template-columns: repeat(2,1fr) !important; }
          .two-col-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}