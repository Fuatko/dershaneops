'use client'
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const IcoStudent  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
const IcoTeacher  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
const IcoCalendar = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
const IcoBook     = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
const IcoAlert    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
const IcoSearch   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
const IcoX        = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>

export default function DashboardPage() {
  const [stats, setStats]               = useState({ students:0, teachers:0, lessons:0, books:0 })
  const [allStudents, setAllStudents]   = useState<any[]>([])
  const [schools, setSchools]           = useState<any[]>([])
  const [upcomingLessons, setUpcomingLessons] = useState<any[]>([])
  const [riskStudents, setRiskStudents] = useState<any[]>([])
  const [loading, setLoading]           = useState(true)

  // Filtreler
  const [searchName, setSearchName]     = useState('')
  const [filterGrade, setFilterGrade]   = useState('')
  const [filterBranch, setFilterBranch] = useState('')
  const [filterSchool, setFilterSchool] = useState('')

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
      { data: schoolData },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count:'exact', head:true }).eq('role', 'student'),
      supabase.from('profiles').select('*', { count:'exact', head:true }).eq('role', 'teacher'),
      supabase.from('lessons').select('*', { count:'exact', head:true }),
      supabase.from('books').select('*', { count:'exact', head:true }),
      supabase.from('profiles').select('id, full_name, grade_level, classroom_id, school_id, phone_number').eq('role', 'student').order('full_name'),
      supabase.from('lessons').select('id, subject, scheduled_at, profiles!lessons_student_id_fkey(id, full_name, grade_level, classroom_id)').eq('status', 'scheduled').gte('scheduled_at', today.toISOString()).order('scheduled_at').limit(8),
      supabase.from('classrooms').select('*').order('grade_level'),
      supabase.from('schools').select('id, name').order('name'),
    ])

    setStats({ students:studentCount??0, teachers:teacherCount??0, lessons:lessonCount??0, books:bookCount??0 })
    setSchools(schoolData ?? [])

    const classroomMap: Record<string,any> = {}
    for (const c of classroomData??[]) classroomMap[c.id] = c

    const studentsWithClass = (students??[]).map(s => ({
      ...s,
      classroom_name: s.classroom_id ? classroomMap[s.classroom_id]?.name ?? null : null,
      grade_level_from_class: s.classroom_id ? classroomMap[s.classroom_id]?.grade_level ?? s.grade_level : s.grade_level,
      branch: s.classroom_id ? (classroomMap[s.classroom_id]?.name ?? '').split('-')[1] ?? '' : '',
    }))
    setAllStudents(studentsWithClass)

    setUpcomingLessons((lessons??[]).map(l => ({
      ...l,
      student_classroom: (l.profiles as any)?.classroom_id ? classroomMap[(l.profiles as any).classroom_id]?.name ?? null : null
    })))

    const riskList: any[] = []
    for (const s of studentsWithClass.slice(0, 15)) {
      const { data: risk } = await supabase.rpc('calculate_risk_score', { p_student_id: s.id })
      if ((risk??0) >= 45) riskList.push({ ...s, risk_score: Math.round(risk??0) })
    }
    riskList.sort((a,b) => b.risk_score - a.risk_score)
    setRiskStudents(riskList.slice(0, 6))
    setLoading(false)
  }

  function getLevelStyle(grade: number) {
    if (grade <= 4)  return { color:'#2E7D52', bg:'#DCFCE7' }
    if (grade <= 8)  return { color:'#1B3A6B', bg:'#EEF3FB' }
    return { color:'#6B4FC8', bg:'#EDE9FE' }
  }

  // Mevcut grade ve branch seçenekleri
  const grades  = [...new Set(allStudents.filter(s=>s.grade_level).map(s=>s.grade_level))].sort((a,b)=>a-b)
  const branches = [...new Set(allStudents.filter(s=>s.branch).map(s=>s.branch))].sort()

  // Filtrelenmiş öğrenciler
  const filteredStudents = allStudents.filter(s => {
    if (searchName  && !s.full_name?.toLowerCase().includes(searchName.toLowerCase())) return false
    if (filterGrade  && String(s.grade_level) !== filterGrade) return false
    if (filterBranch && s.branch !== filterBranch) return false
    if (filterSchool && s.school_id !== filterSchool) return false
    return true
  })

  function clearFilters() {
    setSearchName(''); setFilterGrade(''); setFilterBranch(''); setFilterSchool('')
  }

  const hasFilter = searchName || filterGrade || filterBranch || filterSchool

  const metrics = [
    { label:'Toplam Öğrenci', value:stats.students, color:'#1B3A6B', bg:'#EEF3FB', border:'#BFDBFE', href:'/students', Icon:IcoStudent },
    { label:'Toplam Öğretmen', value:stats.teachers, color:'#2E7D52', bg:'#DCFCE7', border:'#86EFAC', href:'/teachers', Icon:IcoTeacher },
    { label:'Toplam Ders',    value:stats.lessons,  color:'#92400E', bg:'#FEF3C7', border:'#FCD34D', href:'/scheduler', Icon:IcoCalendar },
    { label:'Toplam Kitap',   value:stats.books,    color:'#6B4FC8', bg:'#EDE9FE', border:'#C4B5FD', href:'/books',     Icon:IcoBook },
  ]

  const inp: React.CSSProperties = { padding:'8px 10px', borderRadius:'8px', border:'1px solid #E2E8F0', fontSize:'12px', color:'#1B3A6B', outline:'none', background:'#fff', fontFamily:'inherit' }

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

      {/* Öğrenci Filtre Paneli */}
      <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', marginBottom:'16px', overflow:'hidden' }}>
        <div style={{ padding:'12px 16px', borderBottom:'1px solid #F1F5F9', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'8px' }}>
          <div style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B' }}>
            Öğrenci Listesi
            <span style={{ marginLeft:'8px', fontSize:'11px', fontWeight:600, padding:'1px 8px', borderRadius:'10px', background:'#EEF3FB', color:'#1B3A6B' }}>
              {filteredStudents.length} / {allStudents.length}
            </span>
          </div>
          <div style={{ display:'flex', gap:'6px', alignItems:'center', flexWrap:'wrap' }}>
            {hasFilter && (
              <button onClick={clearFilters}
                style={{ display:'flex', alignItems:'center', gap:'4px', padding:'5px 10px', borderRadius:'6px', border:'1px solid #FECACA', background:'#FEF2F2', color:'#DC2626', fontSize:'11px', fontWeight:600, cursor:'pointer' }}>
                <IcoX /> Filtreyi Temizle
              </button>
            )}
            <Link href="/students" style={{ fontSize:'11px', color:'#1B3A6B', textDecoration:'none', fontWeight:600 }}>Tümünü Gör →</Link>
          </div>
        </div>

        {/* Filtreler */}
        <div style={{ padding:'12px 16px', borderBottom:'1px solid #F1F5F9', display:'flex', flexWrap:'wrap', gap:'8px', alignItems:'center' }}>
          {/* Ad Soyad Ara */}
          <div style={{ display:'flex', alignItems:'center', gap:'6px', background:'#F8FAFC', borderRadius:'8px', border:'1px solid #E2E8F0', padding:'6px 10px', flex:'1', minWidth:'160px' }}>
            <IcoSearch />
            <input
              value={searchName}
              onChange={e => setSearchName(e.target.value)}
              placeholder="Ad soyad ara..."
              style={{ border:'none', outline:'none', background:'transparent', fontSize:'12px', color:'#1B3A6B', width:'100%', fontFamily:'inherit' }}
            />
            {searchName && (
              <button onClick={() => setSearchName('')} style={{ background:'none', border:'none', cursor:'pointer', color:'#94A3B8', display:'flex' }}><IcoX /></button>
            )}
          </div>

          {/* Sınıf */}
          <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)} style={{ ...inp, minWidth:'120px' }}>
            <option value="">Tüm Sınıflar</option>
            {grades.map(g => <option key={g} value={String(g)}>{g}. Sınıf</option>)}
          </select>

          {/* Şube */}
          <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)} style={{ ...inp, minWidth:'100px' }}>
            <option value="">Tüm Şubeler</option>
            {branches.map(b => <option key={b} value={b}>{b} Şubesi</option>)}
          </select>

          {/* Okul */}
          {schools.length > 0 && (
            <select value={filterSchool} onChange={e => setFilterSchool(e.target.value)} style={{ ...inp, minWidth:'160px' }}>
              <option value="">Tüm Okullar</option>
              {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
        </div>

        {/* Sınıf hızlı filtre butonları */}
        <div style={{ padding:'10px 16px', borderBottom:'1px solid #F1F5F9', display:'flex', flexWrap:'wrap', gap:'5px' }}>
          <button onClick={() => setFilterGrade('')}
            style={{ padding:'4px 10px', borderRadius:'20px', border:'1.5px solid', borderColor:filterGrade===''?'#1B3A6B':'#E2E8F0', background:filterGrade===''?'#1B3A6B':'#fff', color:filterGrade===''?'#fff':'#475569', fontSize:'11px', fontWeight:600, cursor:'pointer' }}>
            Tümü ({allStudents.length})
          </button>
          {grades.map(g => {
            const count = allStudents.filter(s => String(s.grade_level) === String(g)).length
            const lv = getLevelStyle(g)
            const isSelected = filterGrade === String(g)
            return (
              <button key={g} onClick={() => setFilterGrade(isSelected ? '' : String(g))}
                style={{ padding:'4px 10px', borderRadius:'20px', border:'1.5px solid', borderColor:isSelected?lv.color:'#E2E8F0', background:isSelected?lv.color:'#fff', color:isSelected?'#fff':lv.color, fontSize:'11px', fontWeight:600, cursor:'pointer' }}>
                {g}. Sınıf ({count})
              </button>
            )
          })}
        </div>

        {/* Öğrenci Tablosu */}
        <div style={{ overflowX:'auto' }}>
          {filteredStudents.length === 0 ? (
            <div style={{ padding:'32px', textAlign:'center', color:'#94A3B8', fontSize:'13px' }}>
              {hasFilter ? 'Bu filtreye uygun öğrenci bulunamadı' : 'Henüz öğrenci yok'}
            </div>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'12.5px' }}>
              <thead>
                <tr style={{ background:'#F8FAFC' }}>
                  {['Ad Soyad','Sınıf','Şube','Okul','Telefon'].map(h => (
                    <th key={h} style={{ padding:'9px 14px', textAlign:'left', fontSize:'11px', fontWeight:700, color:'#475569', borderBottom:'1px solid #E2E8F0', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s, i) => {
                  const lv = s.grade_level ? getLevelStyle(s.grade_level) : null
                  const school = schools.find(sc => sc.id === s.school_id)
                  return (
                    <tr key={s.id} style={{ borderBottom: i < filteredStudents.length-1 ? '1px solid #F8FAFC' : 'none', background: i%2===0 ? '#fff' : '#FAFBFC' }}>
                      <td style={{ padding:'9px 14px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                          <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:lv?.bg??'#EEF3FB', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:700, color:lv?.color??'#1B3A6B', flexShrink:0 }}>
                            {s.full_name?.split(' ').map((n:string)=>n[0]).join('').slice(0,2)}
                          </div>
                          <Link href={`/students`} style={{ fontWeight:600, color:'#1B3A6B', textDecoration:'none' }}>{s.full_name}</Link>
                        </div>
                      </td>
                      <td style={{ padding:'9px 14px' }}>
                        {s.grade_level && lv ? (
                          <span style={{ fontSize:'11px', fontWeight:700, padding:'2px 8px', borderRadius:'10px', background:lv.bg, color:lv.color }}>{s.grade_level}. Sınıf</span>
                        ) : <span style={{ color:'#94A3B8' }}>—</span>}
                      </td>
                      <td style={{ padding:'9px 14px' }}>
                        {s.branch ? (
                          <span style={{ fontSize:'11px', fontWeight:600, padding:'2px 8px', borderRadius:'10px', background:'#F1F5F9', color:'#475569' }}>{s.branch}</span>
                        ) : <span style={{ color:'#94A3B8' }}>—</span>}
                      </td>
                      <td style={{ padding:'9px 14px', color:'#475569' }}>
                        {school?.name ?? <span style={{ color:'#94A3B8' }}>—</span>}
                      </td>
                      <td style={{ padding:'9px 14px', color:'#475569' }}>
                        {s.phone_number ?? <span style={{ color:'#94A3B8' }}>—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Alt kısım: Yaklaşan Dersler + Risk */}
      <div style={{ display:'grid', gap:'16px', marginBottom:'16px' }} className="two-col-grid">

        {/* Yaklaşan Dersler */}
        <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', overflow:'hidden' }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid #F1F5F9', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B' }}>
              Yaklaşan Dersler
              <span style={{ marginLeft:'6px', fontSize:'11px', fontWeight:600, padding:'1px 7px', borderRadius:'10px', background:'#EEF3FB', color:'#1B3A6B' }}>{upcomingLessons.length}</span>
            </div>
            <Link href="/scheduler" style={{ fontSize:'11px', color:'#1B3A6B', textDecoration:'none', fontWeight:600 }}>Takvim →</Link>
          </div>
          <div style={{ overflowY:'auto', maxHeight:'280px' }}>
            {upcomingLessons.length === 0 ? (
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
                    <div style={{ display:'flex', alignItems:'center', gap:'4px' }}>
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

        {/* Risk Uyarıları */}
        <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', overflow:'hidden' }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid #F1F5F9', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'7px' }}>
              <span style={{ color:'#DC2626' }}><IcoAlert /></span>
              <div style={{ fontSize:'13px', fontWeight:700, color:'#DC2626' }}>Risk Uyarıları</div>
              <span style={{ fontSize:'11px', fontWeight:700, padding:'1px 7px', borderRadius:'10px', background:'#FEE2E2', color:'#DC2626' }}>{riskStudents.length}</span>
            </div>
            <Link href="/risk" style={{ fontSize:'11px', color:'#DC2626', textDecoration:'none', fontWeight:600 }}>Risk Analizi →</Link>
          </div>
          <div style={{ overflowY:'auto', maxHeight:'280px' }}>
            {riskStudents.length === 0 ? (
              <div style={{ padding:'28px', textAlign:'center', color:'#94A3B8', fontSize:'13px' }}>Risk altında öğrenci yok</div>
            ) : riskStudents.map((s, i) => {
              const lv = s.grade_level ? getLevelStyle(s.grade_level) : null
              const riskColor = s.risk_score >= 70 ? '#DC2626' : '#D97706'
              const riskBg    = s.risk_score >= 70 ? '#FEF2F2' : '#FEF3C7'
              return (
                <div key={s.id} style={{ padding:'10px 16px', borderBottom:i<riskStudents.length-1?'1px solid #F8FAFC':'none', display:'flex', alignItems:'center', gap:'10px' }}>
                  <div style={{ width:'32px', height:'32px', borderRadius:'50%', background:riskBg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:700, color:riskColor, flexShrink:0 }}>
                    {s.full_name?.split(' ').map((n:string)=>n[0]).join('').slice(0,2)}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:'12.5px', fontWeight:600, color:'#1B3A6B', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{s.full_name}</div>
                    <div style={{ display:'flex', gap:'4px' }}>
                      {lv && s.grade_level && (
                        <span style={{ fontSize:'10px', fontWeight:700, padding:'1px 6px', borderRadius:'5px', background:lv.bg, color:lv.color }}>{s.grade_level}. Sınıf</span>
                      )}
                      {s.branch && (
                        <span style={{ fontSize:'10px', padding:'1px 6px', borderRadius:'5px', background:'#F1F5F9', color:'#475569' }}>{s.branch}</span>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign:'center', flexShrink:0 }}>
                    <div style={{ fontSize:'18px', fontWeight:800, color:riskColor }}>{s.risk_score}</div>
                    <div style={{ fontSize:'9px', color:'#94A3B8' }}>risk</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

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