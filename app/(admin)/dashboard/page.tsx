'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    students: 0, teachers: 0, lessons: 0, books: 0,
    pendingHw: 0, completedHw: 0,
    criticalRisk: 0, totalQuestions: 0,
    todayLessons: 0, cancelledLessons: 0,
  })
  const [recentStudents, setRecentStudents] = useState<any[]>([])
  const [upcomingLessons, setUpcomingLessons] = useState<any[]>([])
  const [riskStudents, setRiskStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const today = new Date()
    const todayStr = today.toISOString().slice(0, 10)
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)

    const [
      { count: studentCount },
      { count: teacherCount },
      { count: lessonCount },
      { count: bookCount },
      { data: hw },
      { data: todayL },
      { data: cancelledL },
      { data: attempts },
      { data: recentS },
      { data: upcomingL },
      { data: profiles },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
      supabase.from('lessons').select('*', { count: 'exact', head: true }),
      supabase.from('books').select('*', { count: 'exact', head: true }),
      supabase.from('homework_assignments').select('status'),
      supabase.from('lessons').select('*', { count: 'exact', head: true }).gte('scheduled_at', todayStr).lt('scheduled_at', tomorrow.toISOString().slice(0, 10)).eq('status', 'scheduled'),
      supabase.from('lessons').select('*', { count: 'exact', head: true }).eq('status', 'cancelled'),
      supabase.from('student_question_attempts').select('total_questions'),
      supabase.from('profiles').select('id, full_name, created_at').eq('role', 'student').order('created_at', { ascending: false }).limit(5),
      supabase.from('lessons').select('*, profiles!lessons_student_id_fkey(full_name)').eq('status', 'scheduled').gte('scheduled_at', today.toISOString()).order('scheduled_at').limit(6),
      supabase.from('profiles').select('id, full_name').eq('role', 'student'),
    ])

    // Risk skorlarını hesapla
    const riskList = []
    for (const p of (profiles ?? []).slice(0, 8)) {
      const { data: risk } = await supabase.rpc('calculate_risk_score', { p_student_id: p.id })
      if ((risk ?? 0) >= 45) riskList.push({ ...p, risk_score: risk ?? 0 })
    }
    riskList.sort((a, b) => b.risk_score - a.risk_score)

    const totalQ = (attempts ?? []).reduce((s, a) => s + a.total_questions, 0)
    const pendingHw = (hw ?? []).filter(h => h.status !== 'completed').length
    const completedHw = (hw ?? []).filter(h => h.status === 'completed').length

    setStats({
      students: studentCount ?? 0,
      teachers: teacherCount ?? 0,
      lessons: lessonCount ?? 0,
      books: bookCount ?? 0,
      pendingHw, completedHw,
      criticalRisk: riskList.filter(r => r.risk_score >= 70).length,
      totalQuestions: totalQ,
      todayLessons: todayL?.length ?? 0,
      cancelledLessons: cancelledL ?? 0,
    })
    setRecentStudents(recentS ?? [])
    setUpcomingLessons(upcomingL ?? [])
    setRiskStudents(riskList.slice(0, 4))
    setLoading(false)
  }

  function getRiskColor(score: number) {
    if (score >= 70) return { color: '#C0392B', bg: '#FEF2F2', label: 'Kritik' }
    if (score >= 45) return { color: '#B45309', bg: '#FDF4E7', label: 'Yüksek' }
    return { color: '#2E7D52', bg: '#EAF4EE', label: 'Normal' }
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#7A8FA8' }}>Yükleniyor...</div>

  return (
    <div style={{ padding: '28px', maxWidth: '1200px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', margin: 0 }}>Dashboard</h1>
        <p style={{ fontSize: '12px', color: '#7A8FA8', margin: '3px 0 0' }}>
          {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Ana Metrikler */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '20px' }}>
        {[
          { label: 'Toplam Öğrenci', value: stats.students, color: '#1B3A6B', bg: '#EEF3FB', href: '/students', icon: (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="6" r="3" stroke="#1B3A6B" strokeWidth="1.5"/><path d="M3 15c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="#1B3A6B" strokeWidth="1.5" strokeLinecap="round"/></svg>
          )},
          { label: 'Toplam Öğretmen', value: stats.teachers, color: '#2E7D52', bg: '#EAF4EE', href: '/teachers', icon: (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="3" width="14" height="10" rx="2" stroke="#2E7D52" strokeWidth="1.5"/><path d="M6 16h6M9 13v3" stroke="#2E7D52" strokeWidth="1.5" strokeLinecap="round"/></svg>
          )},
          { label: 'Toplam Ders', value: stats.lessons, color: '#6B4FC8', bg: '#F0ECFB', href: '/scheduler', icon: (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="3" width="14" height="13" rx="2" stroke="#6B4FC8" strokeWidth="1.5"/><path d="M6 1v4M12 1v4M2 7h14" stroke="#6B4FC8" strokeWidth="1.5" strokeLinecap="round"/></svg>
          )},
          { label: 'Kitap Sayısı', value: stats.books, color: '#B45309', bg: '#FDF4E7', href: '/books', icon: (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 3h5a3 3 0 013 3v9a2 2 0 00-2-2H3V3z" stroke="#B45309" strokeWidth="1.5"/><path d="M15 3h-5a3 3 0 00-3 3v9a2 2 0 012-2h6V3z" stroke="#B45309" strokeWidth="1.5"/></svg>
          )},
        ].map(m => (
          <Link key={m.label} href={m.href} style={{ textDecoration: 'none' }}>
            <div style={{ background: m.bg, borderRadius: '12px', padding: '16px', cursor: 'pointer', border: '1px solid transparent' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ fontSize: '11px', color: m.color, fontWeight: 600 }}>{m.label}</div>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{m.icon}</div>
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: m.color }}>{m.value}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* İkinci Satır Metrikler */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '24px' }}>
        {[
          { label: 'Bugünkü Ders', value: stats.todayLessons, color: '#1B3A6B', bg: '#EEF3FB' },
          { label: 'Bekleyen Ödev', value: stats.pendingHw, color: '#B45309', bg: '#FDF4E7' },
          { label: 'Kritik Riskli', value: stats.criticalRisk, color: '#C0392B', bg: '#FEF2F2' },
          { label: 'Çözülen Soru', value: stats.totalQuestions, color: '#6B4FC8', bg: '#F0ECFB' },
        ].map(m => (
          <div key={m.label} style={{ background: m.bg, borderRadius: '12px', padding: '14px 16px', border: '1px solid transparent' }}>
            <div style={{ fontSize: '11px', color: m.color, fontWeight: 600, marginBottom: '6px' }}>{m.label}</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Hızlı Erişim */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#7A8FA8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Hızlı Erişim</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { label: 'Soru Girişi', href: '/questions', color: '#1B3A6B' },
            { label: 'Risk Analizi', href: '/risk', color: '#C0392B' },
            { label: 'Hakimiyet Haritası', href: '/performance', color: '#2E7D52' },
            { label: 'Çalışma Planı', href: '/studyplan', color: '#6B4FC8' },
            { label: 'Veli Raporu', href: '/parentreport', color: '#B45309' },
            { label: 'Gelişim Profili', href: '/profile', color: '#1B3A6B' },
            { label: 'Planlama', href: '/scheduler', color: '#2563EB' },
            { label: 'Ödev Ata', href: '/books/assign', color: '#B45309' },
          ].map(item => (
            <Link key={item.label} href={item.href} style={{ padding: '7px 14px', borderRadius: '8px', background: '#fff', border: '1px solid #E2EAF8', fontSize: '12.5px', fontWeight: 600, color: item.color, textDecoration: 'none' }}>
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Alt Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px' }}>

        {/* Yaklaşan Dersler */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #D5DFF0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>Yaklaşan Dersler</span>
            <Link href="/scheduler" style={{ fontSize: '11.5px', color: '#1B3A6B', textDecoration: 'none', fontWeight: 600 }}>Tümü →</Link>
          </div>
          {upcomingLessons.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', fontSize: '12px', color: '#7A8FA8' }}>Planlanmış ders yok</div>
          ) : upcomingLessons.map((l, i) => (
            <div key={l.id} style={{ padding: '11px 16px', borderBottom: i < upcomingLessons.length - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1B3A6B', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#1B3A6B' }}>{l.subject}</div>
                <div style={{ fontSize: '11px', color: '#7A8FA8' }}>{l.profiles?.full_name}</div>
              </div>
              <span style={{ fontSize: '11px', color: '#7A8FA8' }}>{new Date(l.scheduled_at).toLocaleDateString('tr-TR')}</span>
            </div>
          ))}
        </div>

        {/* Son Öğrenciler */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #D5DFF0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>Son Kayıtlar</span>
            <Link href="/students" style={{ fontSize: '11.5px', color: '#1B3A6B', textDecoration: 'none', fontWeight: 600 }}>Tümü →</Link>
          </div>
          {recentStudents.map((s, i) => (
            <div key={s.id} style={{ padding: '11px 16px', borderBottom: i < recentStudents.length - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#E2EAF8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#1B3A6B', flexShrink: 0 }}>
                {s.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#1B3A6B' }}>{s.full_name}</div>
                <div style={{ fontSize: '11px', color: '#7A8FA8' }}>{new Date(s.created_at).toLocaleDateString('tr-TR')}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Risk Uyarıları */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #D5DFF0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#C0392B' }}>Risk Uyarıları</span>
            <Link href="/risk" style={{ fontSize: '11.5px', color: '#C0392B', textDecoration: 'none', fontWeight: 600 }}>Tümü →</Link>
          </div>
          {riskStudents.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', fontSize: '12px', color: '#2E7D52' }}>Kritik risk yok!</div>
          ) : riskStudents.map((s, i) => {
            const rl = getRiskColor(s.risk_score)
            return (
              <div key={s.id} style={{ padding: '11px 16px', borderBottom: i < riskStudents.length - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#E2EAF8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#1B3A6B', flexShrink: 0 }}>
                  {s.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#1B3A6B' }}>{s.full_name}</div>
                </div>
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: rl.color }}>{Math.round(s.risk_score)}</div>
                  <span style={{ fontSize: '9.5px', fontWeight: 700, padding: '1px 6px', borderRadius: '8px', background: rl.bg, color: rl.color }}>{rl.label}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}