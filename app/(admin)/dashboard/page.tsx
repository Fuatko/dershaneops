'use client'
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DashboardPage() {
  const [stats, setStats] = useState({ students: 0, teachers: 0, lessons: 0, books: 0 })
  const [recentStudents, setRecentStudents] = useState<any[]>([])
  const [allStudents, setAllStudents] = useState<any[]>([])
  const [upcomingLessons, setUpcomingLessons] = useState<any[]>([])
  const [riskStudents, setRiskStudents] = useState<any[]>([])
  const [classrooms, setClassrooms] = useState<any[]>([])
  const [selectedClassroom, setSelectedClassroom] = useState<string>('all')
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
      supabase.from('profiles').select('id, full_name, created_at, grade_level, classroom_id, classrooms(name)').eq('role', 'student').order('grade_level', { ascending: true }),
      supabase.from('lessons').select('*, profiles!lessons_student_id_fkey(full_name, grade_level, classrooms(name))').eq('status', 'scheduled').gte('scheduled_at', today.toISOString()).order('scheduled_at').limit(6),
      supabase.from('classrooms').select('*').order('grade_level'),
    ])

    setStats({ students: studentCount ?? 0, teachers: teacherCount ?? 0, lessons: lessonCount ?? 0, books: bookCount ?? 0 })
    setAllStudents(students ?? [])
    setRecentStudents((students ?? []).slice(0, 8))
    setUpcomingLessons(lessons ?? [])
    setClassrooms(classroomData ?? [])

    // Risk skorları
    const riskList = []
    for (const s of (students ?? []).slice(0, 15)) {
      const { data: risk } = await supabase.rpc('calculate_risk_score', { p_student_id: s.id })
      if ((risk ?? 0) >= 45) riskList.push({ ...s, risk_score: Math.round(risk ?? 0) })
    }
    riskList.sort((a, b) => b.risk_score - a.risk_score)
    setRiskStudents(riskList.slice(0, 5))
    setLoading(false)
  }

  function getSchoolLevel(grade: number) {
    if (grade <= 4) return { label: 'İlkokul', color: '#2E7D52', bg: '#EAF4EE' }
    if (grade <= 8) return { label: 'Ortaokul', color: '#1B3A6B', bg: '#EEF3FB' }
    return { label: 'Lise', color: '#6B4FC8', bg: '#F0ECFB' }
  }

  const filteredStudents = selectedClassroom === 'all'
    ? allStudents
    : allStudents.filter(s => s.classroom_id === selectedClassroom)

  // Sınıf bazlı istatistik
  const classroomStats = classrooms.map(c => ({
    ...c,
    studentCount: allStudents.filter(s => s.classroom_id === c.id).length,
  })).filter(c => c.studentCount > 0)

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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Toplam Öğrenci', value: stats.students, color: '#1B3A6B', bg: '#EEF3FB', href: '/students', icon: '👨‍🎓' },
          { label: 'Toplam Öğretmen', value: stats.teachers, color: '#2E7D52', bg: '#EAF4EE', href: '/teachers', icon: '👨‍🏫' },
          { label: 'Toplam Ders', value: stats.lessons, color: '#B45309', bg: '#FDF4E7', href: '/scheduler', icon: '📅' },
          { label: 'Toplam Kitap', value: stats.books, color: '#6B4FC8', bg: '#F0ECFB', href: '/books', icon: '📚' },
        ].map(m => (
          <Link key={m.label} href={m.href} style={{ textDecoration: 'none' }}>
            <div style={{ background: m.bg, borderRadius: '12px', padding: '16px 18px', cursor: 'pointer', transition: 'transform 0.1s', border: '1px solid rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ fontSize: '11px', color: m.color, fontWeight: 700 }}>{m.label}</div>
                <span style={{ fontSize: '20px' }}>{m.icon}</span>
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: m.color }}>{m.value}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Sınıf Bazlı Özet */}
      {classroomStats.length > 0 && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '18px', marginBottom: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '14px' }}>📊 Sınıf Bazlı Öğrenci Dağılımı</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setSelectedClassroom('all')}
              style={{ padding: '6px 14px', borderRadius: '20px', border: '1.5px solid', borderColor: selectedClassroom === 'all' ? '#1B3A6B' : '#D5DFF0', background: selectedClassroom === 'all' ? '#1B3A6B' : '#fff', color: selectedClassroom === 'all' ? '#fff' : '#4A6080', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
            >
              Tümü ({allStudents.length})
            </button>
            {['İlkokul', 'Ortaokul', 'Lise'].map(level => {
              const levelClasses = classroomStats.filter(c =>
                level === 'İlkokul' ? c.grade_level <= 4 :
                level === 'Ortaokul' ? c.grade_level >= 5 && c.grade_level <= 8 :
                c.grade_level >= 9
              )
              if (levelClasses.length === 0) return null
              const lv = getSchoolLevel(level === 'İlkokul' ? 1 : level === 'Ortaokul' ? 5 : 9)
              return (
                <div key={level} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: lv.color, background: lv.bg, padding: '3px 8px', borderRadius: '8px' }}>{level}</div>
                  {levelClasses.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedClassroom(c.id)}
                      style={{ padding: '6px 12px', borderRadius: '20px', border: '1.5px solid', borderColor: selectedClassroom === c.id ? lv.color : '#D5DFF0', background: selectedClassroom === c.id ? lv.bg : '#fff', color: selectedClassroom === c.id ? lv.color : '#4A6080', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      {c.name} ({c.studentCount})
                    </button>
                  ))}
                </div>
              )
            })}
          </div>

          {/* Sınıf barları */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '8px', marginTop: '14px' }}>
            {classroomStats.map(c => {
              const lv = getSchoolLevel(c.grade_level)
              const isSelected = selectedClassroom === c.id
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedClassroom(isSelected ? 'all' : c.id)}
                  style={{ background: isSelected ? lv.bg : '#F8FAFF', borderRadius: '10px', padding: '12px', textAlign: 'center', cursor: 'pointer', border: '1.5px solid', borderColor: isSelected ? lv.color : '#E2EAF8', transition: 'all 0.15s' }}
                >
                  <div style={{ fontSize: '18px', fontWeight: 800, color: lv.color }}>{c.studentCount}</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#1B3A6B', marginTop: '2px' }}>{c.name}</div>
                  <div style={{ fontSize: '10px', color: '#7A8FA8' }}>{lv.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>

        {/* Öğrenci Listesi */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #D5DFF0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>
              {selectedClassroom === 'all' ? 'Tüm Öğrenciler' : classrooms.find(c => c.id === selectedClassroom)?.name + ' Öğrencileri'} ({filteredStudents.length})
            </div>
            <Link href="/students" style={{ fontSize: '11.5px', color: '#1B3A6B', textDecoration: 'none', fontWeight: 600 }}>Tümü →</Link>
          </div>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {filteredStudents.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#7A8FA8', fontSize: '13px' }}>Bu sınıfta öğrenci yok</div>
            ) : filteredStudents.map((s, i) => {
              const lv = s.grade_level ? getSchoolLevel(s.grade_level) : null
              return (
                <div key={s.id} style={{ padding: '11px 18px', borderBottom: i < filteredStudents.length - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#EEF3FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#1B3A6B', flexShrink: 0 }}>
                    {s.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#1B3A6B' }}>{s.full_name}</div>
                      {lv && (
                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '6px', background: lv.bg, color: lv.color }}>
                          {s.grade_level}. Sınıf
                        </span>
                      )}
                      {(s.classrooms as any)?.name && (
                        <span style={{ fontSize: '10px', fontWeight: 600, padding: '1px 6px', borderRadius: '6px', background: '#F0F4F9', color: '#4A6080' }}>
                          {(s.classrooms as any).name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Yaklaşan Dersler */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #D5DFF0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>Yaklaşan Dersler ({upcomingLessons.length})</div>
            <Link href="/scheduler" style={{ fontSize: '11.5px', color: '#1B3A6B', textDecoration: 'none', fontWeight: 600 }}>Takvim →</Link>
          </div>
          {upcomingLessons.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#7A8FA8', fontSize: '13px' }}>Planlanmış ders yok</div>
          ) : upcomingLessons.map((l, i) => {
            const lv = l.profiles?.grade_level ? getSchoolLevel(l.profiles.grade_level) : null
            return (
              <div key={l.id} style={{ padding: '12px 18px', borderBottom: i < upcomingLessons.length - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#EEF3FB', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#1B3A6B' }}>
                    {new Date(l.scheduled_at).toLocaleDateString('tr-TR', { day: 'numeric' })}
                  </div>
                  <div style={{ fontSize: '9px', color: '#7A8FA8' }}>
                    {new Date(l.scheduled_at).toLocaleDateString('tr-TR', { month: 'short' })}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#1B3A6B', marginBottom: '2px' }}>{l.subject}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#7A8FA8' }}>
                    <span>{l.profiles?.full_name}</span>
                    {lv && (
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '6px', background: lv.bg, color: lv.color }}>
                        {l.profiles?.grade_level}. Sınıf
                      </span>
                    )}
                    {(l.profiles?.classrooms as any)?.name && (
                      <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '6px', background: '#F0F4F9', color: '#4A6080' }}>
                        {(l.profiles?.classrooms as any).name}
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0' }}>
            {riskStudents.map((s, i) => {
              const lv = s.grade_level ? getSchoolLevel(s.grade_level) : null
              const riskColor = s.risk_score >= 70 ? '#C0392B' : '#B45309'
              const riskBg = s.risk_score >= 70 ? '#FEF2F2' : '#FDF4E7'
              return (
                <div key={s.id} style={{ padding: '12px 18px', borderRight: '1px solid #F0F4F9', borderBottom: '1px solid #F0F4F9', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: riskBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: riskColor, flexShrink: 0 }}>
                    {s.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
                      <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#1B3A6B' }}>{s.full_name}</div>
                      {lv && <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 5px', borderRadius: '5px', background: lv.bg, color: lv.color }}>{s.grade_level}. Sınıf</span>}
                      {(s.classrooms as any)?.name && <span style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '5px', background: '#F0F4F9', color: '#4A6080' }}>{(s.classrooms as any).name}</span>}
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