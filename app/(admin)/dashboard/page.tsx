'use client'
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DashboardPage() {
  const [stats, setStats] = useState({ students: 0, teachers: 0, lessons: 0, books: 0 })
  const [allStudents, setAllStudents] = useState<any[]>([])
  const [upcomingLessons, setUpcomingLessons] = useState<any[]>([])
  const [riskStudents, setRiskStudents] = useState<any[]>([])
  const [classrooms, setClassrooms] = useState<any[]>([])
  const [selectedGrade, setSelectedGrade] = useState<number | 'all'>('all')
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
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
      supabase.from('lessons').select('*', { count: 'exact', head: true }),
      supabase.from('books').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('id, full_name, created_at, grade_level, classroom_id').eq('role', 'student').order('grade_level', { ascending: true }),
      supabase.from('lessons').select('id, subject, scheduled_at, profiles!lessons_student_id_fkey(id, full_name, grade_level, classroom_id)').eq('status', 'scheduled').gte('scheduled_at', today.toISOString()).order('scheduled_at').limit(8),
      supabase.from('classrooms').select('*').order('grade_level'),
    ])

    setStats({ students: studentCount ?? 0, teachers: teacherCount ?? 0, lessons: lessonCount ?? 0, books: bookCount ?? 0 })
    setClassrooms(classroomData ?? [])

    const classroomMap: Record<string, string> = {}
    for (const c of classroomData ?? []) classroomMap[c.id] = c.name

    const studentsWithClass = (students ?? []).map(s => ({
      ...s,
      classroom_name: s.classroom_id ? (classroomMap[s.classroom_id] ?? null) : null,
    }))
    setAllStudents(studentsWithClass)

    const lessonsWithClass = (lessons ?? []).map(l => ({
      ...l,
      student_classroom: (l.profiles as any)?.classroom_id ? (classroomMap[(l.profiles as any).classroom_id] ?? null) : null,
    }))
    setUpcomingLessons(lessonsWithClass)

    const riskList: any[] = []
    for (const s of studentsWithClass.slice(0, 15)) {
      const { data: risk } = await supabase.rpc('calculate_risk_score', { p_student_id: s.id })
      if ((risk ?? 0) >= 45) riskList.push({ ...s, risk_score: Math.round(risk ?? 0) })
    }
    riskList.sort((a, b) => b.risk_score - a.risk_score)
    setRiskStudents(riskList.slice(0, 6))
    setLoading(false)
  }

  function getLevelStyle(grade: number) {
    if (grade <= 4) return { color: '#2E7D52', bg: '#EAF4EE', label: 'İlkokul' }
    if (grade <= 8) return { color: '#1B3A6B', bg: '#EEF3FB', label: 'Ortaokul' }
    return { color: '#6B4FC8', bg: '#F0ECFB', label: 'Lise' }
  }

  // Sınıf bazlı gruplama
  const gradeGroups = allStudents.reduce((acc: any, s) => {
    const g = s.grade_level ?? 0
    if (!acc[g]) acc[g] = []
    acc[g].push(s)
    return acc
  }, {})

  const sortedGrades = Object.keys(gradeGroups).map(Number).sort((a, b) => a - b)

  const filteredStudents = selectedGrade === 'all'
    ? allStudents
    : (gradeGroups[selectedGrade] ?? [])

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#F0F4F9' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '36px', marginBottom: '12px' }}>📊</div>
        <div style={{ fontSize: '14px', color: '#7A8FA8' }}>Yükleniyor...</div>
      </div>
    </div>
  )

  return (
    <div style={{ padding: '28px', maxWidth: '1300px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#1B3A6B', margin: 0 }}>Dashboard</h1>
        <p style={{ fontSize: '12px', color: '#7A8FA8', margin: '3px 0 0' }}>
          {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Ana Metrikler */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Toplam Öğrenci', value: stats.students, color: '#1B3A6B', bg: '#EEF3FB', href: '/students', icon: '👨‍🎓' },
          { label: 'Toplam Öğretmen', value: stats.teachers, color: '#2E7D52', bg: '#EAF4EE', href: '/teachers', icon: '👨‍🏫' },
          { label: 'Toplam Ders', value: stats.lessons, color: '#B45309', bg: '#FDF4E7', href: '/scheduler', icon: '📅' },
          { label: 'Toplam Kitap', value: stats.books, color: '#6B4FC8', bg: '#F0ECFB', href: '/books', icon: '📚' },
        ].map(m => (
          <Link key={m.label} href={m.href} style={{ textDecoration: 'none' }}>
            <div style={{ background: m.bg, borderRadius: '12px', padding: '16px 18px', border: '1px solid rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ fontSize: '11px', color: m.color, fontWeight: 700 }}>{m.label}</div>
                <span style={{ fontSize: '20px' }}>{m.icon}</span>
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: m.color }}>{m.value}</div>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 1fr', gap: '16px', marginBottom: '16px' }}>

        {/* Sol: Sınıf Bazlı Filtre */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden', alignSelf: 'flex-start' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #D5DFF0', fontSize: '12.5px', fontWeight: 700, color: '#1B3A6B' }}>
            Sınıfa Göre Filtrele
          </div>
          <div
            onClick={() => setSelectedGrade('all')}
            style={{ padding: '10px 16px', borderBottom: '1px solid #F0F4F9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: selectedGrade === 'all' ? '#F5F8FF' : '#fff', borderLeft: selectedGrade === 'all' ? '3px solid #1B3A6B' : '3px solid transparent' }}
          >
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>Tüm Sınıflar</span>
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', background: '#EEF3FB', color: '#1B3A6B' }}>{allStudents.length}</span>
          </div>

          {['İlkokul', 'Ortaokul', 'Lise'].map(level => {
            const levelGrades = sortedGrades.filter(g =>
              level === 'İlkokul' ? g >= 1 && g <= 4 :
              level === 'Ortaokul' ? g >= 5 && g <= 8 :
              g >= 9 && g <= 12
            )
            if (levelGrades.length === 0) return null
            const lv = getLevelStyle(level === 'İlkokul' ? 1 : level === 'Ortaokul' ? 5 : 9)
            return (
              <div key={level}>
                <div style={{ padding: '6px 16px', background: lv.bg, fontSize: '10px', fontWeight: 700, color: lv.color, letterSpacing: '0.5px' }}>
                  {level}
                </div>
                {levelGrades.map(g => {
                  const count = gradeGroups[g]?.length ?? 0
                  const isSelected = selectedGrade === g
                  const lv2 = getLevelStyle(g)
                  return (
                    <div key={g} onClick={() => setSelectedGrade(isSelected ? 'all' : g)} style={{ padding: '10px 16px', borderBottom: '1px solid #F0F4F9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: isSelected ? '#F5F8FF' : '#fff', borderLeft: isSelected ? '3px solid ' + lv2.color : '3px solid transparent' }}>
                      <span style={{ fontSize: '13px', fontWeight: isSelected ? 700 : 500, color: '#1B3A6B' }}>{g}. Sınıf</span>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', background: lv2.bg, color: lv2.color }}>{count}</span>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* Orta: Öğrenci Listesi */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #D5DFF0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>
              {selectedGrade === 'all' ? `Tüm Öğrenciler (${filteredStudents.length})` : `${selectedGrade}. Sınıf Öğrencileri (${filteredStudents.length})`}
            </div>
            <Link href="/students" style={{ fontSize: '11.5px', color: '#1B3A6B', textDecoration: 'none', fontWeight: 600 }}>Tümü →</Link>
          </div>
          <div style={{ overflowY: 'auto', maxHeight: '420px' }}>
            {filteredStudents.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#7A8FA8', fontSize: '13px' }}>Bu sınıfta öğrenci yok</div>
            ) : filteredStudents.map((s: any, i: number) => {
              const lv = s.grade_level ? getLevelStyle(s.grade_level) : null
              return (
                <div key={s.id} style={{ padding: '11px 18px', borderBottom: i < filteredStudents.length - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: lv ? lv.bg : '#EEF3FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: lv ? lv.color : '#1B3A6B', flexShrink: 0 }}>
                    {s.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#1B3A6B', marginBottom: '2px' }}>{s.full_name}</div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {lv && s.grade_level && (
                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '5px', background: lv.bg, color: lv.color }}>
                          {s.grade_level}. Sınıf
                        </span>
                      )}
                      {s.classroom_name && (
                        <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '5px', background: '#F0F4F9', color: '#4A6080', fontWeight: 600 }}>
                          {s.classroom_name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Sağ: Yaklaşan Dersler */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #D5DFF0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>Yaklaşan Dersler ({upcomingLessons.length})</div>
            <Link href="/scheduler" style={{ fontSize: '11.5px', color: '#1B3A6B', textDecoration: 'none', fontWeight: 600 }}>Takvim →</Link>
          </div>
          <div style={{ overflowY: 'auto', maxHeight: '420px' }}>
            {upcomingLessons.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#7A8FA8', fontSize: '13px' }}>Planlanmış ders yok</div>
            ) : upcomingLessons.map((l, i) => {
              const profile = l.profiles as any
              const lv = profile?.grade_level ? getLevelStyle(profile.grade_level) : null
              return (
                <div key={l.id} style={{ padding: '11px 18px', borderBottom: i < upcomingLessons.length - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#EEF3FB', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#1B3A6B' }}>
                      {new Date(l.scheduled_at).toLocaleDateString('tr-TR', { day: 'numeric' })}
                    </div>
                    <div style={{ fontSize: '9px', color: '#7A8FA8' }}>
                      {new Date(l.scheduled_at).toLocaleDateString('tr-TR', { month: 'short' })}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#1B3A6B', marginBottom: '3px' }}>{l.subject}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', color: '#7A8FA8' }}>{profile?.full_name}</span>
                      {lv && profile?.grade_level && (
                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 5px', borderRadius: '5px', background: lv.bg, color: lv.color }}>
                          {profile.grade_level}. Sınıf
                        </span>
                      )}
                      {l.student_classroom && (
                        <span style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '5px', background: '#F0F4F9', color: '#4A6080', fontWeight: 600 }}>
                          {l.student_classroom}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#7A8FA8', flexShrink: 0 }}>
                    {new Date(l.scheduled_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Risk Uyarıları */}
      {riskStudents.length > 0 && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #FECACA', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #FEE2E2', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>🚨</span>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#C0392B' }}>Risk Uyarıları ({riskStudents.length} öğrenci)</div>
            </div>
            <Link href="/risk" style={{ fontSize: '11.5px', color: '#C0392B', textDecoration: 'none', fontWeight: 600 }}>Risk Analizi →</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {riskStudents.map((s, i) => {
              const lv = s.grade_level ? getLevelStyle(s.grade_level) : null
              const riskColor = s.risk_score >= 70 ? '#C0392B' : '#B45309'
              const riskBg = s.risk_score >= 70 ? '#FEF2F2' : '#FDF4E7'
              return (
                <div key={s.id} style={{ padding: '12px 18px', borderRight: '1px solid #F0F4F9', borderBottom: '1px solid #F0F4F9', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: riskBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: riskColor, flexShrink: 0 }}>
                    {s.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#1B3A6B', marginBottom: '2px' }}>{s.full_name}</div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {lv && s.grade_level && (
                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 5px', borderRadius: '5px', background: lv.bg, color: lv.color }}>
                          {s.grade_level}. Sınıf
                        </span>
                      )}
                      {s.classroom_name && (
                        <span style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '5px', background: '#F0F4F9', color: '#4A6080', fontWeight: 600 }}>
                          {s.classroom_name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: riskColor }}>{s.risk_score}</div>
                    <div style={{ fontSize: '9px', color: '#7A8FA8' }}>risk</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}