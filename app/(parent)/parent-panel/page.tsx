'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ParentPanelPage() {
  const [profile, setProfile] = useState<any>(null)
  const [children, setChildren] = useState<any[]>([])
  const [selectedChild, setSelectedChild] = useState<any>(null)
  const [topicPerf, setTopicPerf] = useState<any[]>([])
  const [homework, setHomework] = useState<any[]>([])
  const [streak, setStreak] = useState<any>(null)
  const [goals, setGoals] = useState<any[]>([])
  const [calendar, setCalendar] = useState<any[]>([])
  const [calendarNotes, setCalendarNotes] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))
  const [calendarView, setCalendarView] = useState<'week' | 'month'>('week')
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getMonday(new Date()))
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const supabase = createClient()

  function getMonday(d: Date) {
    const date = new Date(d)
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1)
    date.setDate(diff)
    date.setHours(0, 0, 0, 0)
    return date
  }

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    const { data: p } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()
    if (!p) { setLoading(false); return }
    setProfile(p)

    // Velinin çocuklarını bul
    const { data: ps } = await supabase
      .from('parent_students')
      .select('student_id, profiles!parent_students_student_id_fkey(id, full_name, grade_level, classroom_id)')
      .eq('parent_id', p.id)

    const kids = (ps ?? []).map((x: any) => x.profiles).filter(Boolean)

    // Sınıf isimleri
    const { data: classroomData } = await supabase.from('classrooms').select('id, name')
    const classroomMap: Record<string, string> = {}
    for (const c of classroomData ?? []) classroomMap[c.id] = c.name
    const kidsWithClass = kids.map((k: any) => ({ ...k, classroom_name: k.classroom_id ? (classroomMap[k.classroom_id] ?? null) : null }))

    setChildren(kidsWithClass)
    if (kidsWithClass.length > 0) {
      setSelectedChild(kidsWithClass[0])
      await loadChildData(kidsWithClass[0].id)
    }
    setLoading(false)
  }

  async function loadChildData(childId: string) {
    const [{ data: tp }, { data: hw }, { data: st }, { data: g }, { data: cal }, { data: notes }] = await Promise.all([
      supabase.from('student_topic_performance').select('*, topics(name), subjects(name)').eq('student_id', childId).order('accuracy_rate', { ascending: true }),
      supabase.from('homework_assignments').select('*, tests(name, chapters(name, books(name)))').eq('student_id', childId).order('created_at', { ascending: false }),
      supabase.from('student_streaks').select('*').eq('student_id', childId).single(),
      supabase.from('student_goals').select('*').eq('student_id', childId).eq('status', 'active'),
      supabase.from('study_calendar').select('*, subjects(name), topics(name)').eq('student_id', childId).order('calendar_date'),
      supabase.from('calendar_notes').select('*, profiles!calendar_notes_teacher_id_fkey(full_name)').eq('student_id', childId).order('calendar_date', { ascending: false }),
    ])
    setTopicPerf(tp ?? [])
    setHomework(hw ?? [])
    setStreak(st)
    setGoals(g ?? [])
    setCalendar(cal ?? [])
    setCalendarNotes(notes ?? [])
  }

  async function switchChild(child: any) {
    setSelectedChild(child)
    setLoading(true)
    await loadChildData(child.id)
    setLoading(false)
  }

  async function signOut() { await supabase.auth.signOut(); window.location.href = '/login' }

  // Takvim yardımcılar
  function getWeekDays(start: Date) {
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d })
  }
  function getMonthDays(date: Date) {
    const year = date.getFullYear(), month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startPad = (firstDay.getDay() + 6) % 7
    const days: (Date | null)[] = []
    for (let i = 0; i < startPad; i++) days.push(null)
    for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i))
    return days
  }
  function ds(d: Date) { return d.toISOString().slice(0, 10) }
  function getCalForDate(dateStr: string) { return calendar.filter(c => c.calendar_date === dateStr) }
  function getNoteForDate(dateStr: string) { return calendarNotes.find(n => n.calendar_date === dateStr) }

  const weekDays = getWeekDays(currentWeekStart)
  const monthDays = getMonthDays(currentMonth)
  const todayStr = new Date().toISOString().slice(0, 10)
  const selectedItems = getCalForDate(selectedDate)
  const selectedNote = getNoteForDate(selectedDate)
  const DAYS_SHORT = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
  const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']

  const totalQ = topicPerf.reduce((s, t) => s + t.total_questions, 0)
  const totalC = topicPerf.reduce((s, t) => s + t.correct_count, 0)
  const overallRate = totalQ > 0 ? Math.round(totalC / totalQ * 100) : 0
  const pendingHw = homework.filter(h => h.status !== 'completed').length
  const weakTopics = topicPerf.filter(t => t.accuracy_rate < 50)
  const strongTopics = topicPerf.filter(t => t.accuracy_rate >= 70)

  const evalStyle: any = {
    good: { bg: '#EAF4EE', color: '#2E7D52', label: '✓ Yeterli', icon: '✓' },
    warning: { bg: '#FDF4E7', color: '#B45309', label: '⚠ Dikkat', icon: '⚠' },
    insufficient: { bg: '#FEF2F2', color: '#C0392B', label: '✗ Yetersiz', icon: '✗' },
  }

  // Bu hafta tamamlanan takvim görevleri
  const thisWeekCompleted = calendar.filter(c => {
    const d = new Date(c.calendar_date)
    const now = new Date()
    const weekStart = getMonday(now)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    return c.status === 'completed' && d >= weekStart && d <= weekEnd
  }).length

  const thisWeekTotal = calendar.filter(c => {
    const d = new Date(c.calendar_date)
    const now = new Date()
    const weekStart = getMonday(now)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    return d >= weekStart && d <= weekEnd
  }).length

  // Şüpheli tamamlamalar
  const suspiciousCount = calendar.filter(c => c.is_suspicious && c.teacher_approved === null).length

  const TABS = [
    { id: 'dashboard', label: 'Genel', icon: '🏠' },
    { id: 'calendar', label: 'Takvim', icon: '🗓' },
    { id: 'performance', label: 'Performans', icon: '📊' },
    { id: 'homework', label: 'Ödevler', icon: '📚' },
  ]

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#F0F4F9' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>👨‍👩‍👧</div>
        <div style={{ fontSize: '14px', color: '#7A8FA8' }}>Yükleniyor...</div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F0F4F9', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>

      {/* Header */}
      <div style={{ background: '#6B4FC8', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>👨‍👩‍👧</div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>DershaneOPS</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)' }}>Veli — {profile?.full_name?.split(' ')[0]}</div>
          </div>
        </div>
        <button onClick={signOut} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', padding: '6px 10px', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>Çıkış</button>
      </div>

      {/* Çocuk seçici */}
      {children.length > 1 && (
        <div style={{ background: '#fff', padding: '10px 16px', display: 'flex', gap: '8px', overflowX: 'auto', borderBottom: '1px solid #F0F4F9' }}>
          {children.map(child => (
            <button key={child.id} onClick={() => switchChild(child)} style={{ padding: '6px 14px', borderRadius: '20px', border: '2px solid', borderColor: selectedChild?.id === child.id ? '#6B4FC8' : '#E2EAF8', background: selectedChild?.id === child.id ? '#F0ECFB' : '#fff', color: selectedChild?.id === child.id ? '#6B4FC8' : '#7A8FA8', fontSize: '12px', fontWeight: selectedChild?.id === child.id ? 700 : 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {child.full_name?.split(' ')[0]}{child.grade_level ? ' · ' + child.grade_level + '. Sınıf' : ''}
            </button>
          ))}
        </div>
      )}

      {/* Alt Tab Bar */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #E2EAF8', display: 'flex', zIndex: 100, paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flex: 1, padding: '8px 4px 10px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
            <span style={{ fontSize: '18px' }}>{tab.icon}</span>
            <span style={{ fontSize: '9px', fontWeight: activeTab === tab.id ? 700 : 500, color: activeTab === tab.id ? '#6B4FC8' : '#9CA3AF' }}>{tab.label}</span>
            {activeTab === tab.id && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#6B4FC8' }} />}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px 16px 80px' }}>

        {!selectedChild ? (
          <div style={{ background: '#F8FAFF', borderRadius: '14px', padding: '40px', textAlign: 'center', color: '#7A8FA8' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>👨‍👩‍👧</div>
            <div style={{ fontSize: '14px' }}>Henüz çocuk kaydı yok</div>
          </div>
        ) : (
          <>

            {/* ── GENEL ── */}
            {activeTab === 'dashboard' && (
              <div>
                {/* Hero kart */}
                <div style={{ background: 'linear-gradient(135deg, #6B4FC8 0%, #8B5CF6 100%)', borderRadius: '16px', padding: '18px', marginBottom: '14px', color: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 800, marginBottom: '4px' }}>{selectedChild.full_name} 👋</div>
                      <div style={{ fontSize: '12px', opacity: 0.8 }}>
                        {selectedChild.grade_level ? selectedChild.grade_level + '. Sınıf' : ''}{selectedChild.classroom_name ? ' — ' + selectedChild.classroom_name : ''}
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '8px 14px' }}>
                      <div style={{ fontSize: '28px', fontWeight: 800 }}>%{overallRate}</div>
                      <div style={{ fontSize: '10px', opacity: 0.7 }}>Genel başarı</div>
                    </div>
                  </div>
                </div>

                {/* Metrikler */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '10px', marginBottom: '14px' }}>
                  {[
                    { label: 'Çalışma serisi', value: (streak?.current_streak ?? 0) + ' gün', icon: '🔥', color: '#B45309', bg: '#FDF4E7' },
                    { label: 'Bu hafta görev', value: thisWeekCompleted + '/' + thisWeekTotal, icon: '✅', color: '#2E7D52', bg: '#EAF4EE' },
                    { label: 'Bekleyen ödev', value: pendingHw, icon: '📝', color: pendingHw > 0 ? '#B45309' : '#2E7D52', bg: pendingHw > 0 ? '#FDF4E7' : '#EAF4EE' },
                    { label: 'Güçlü konu', value: strongTopics.length, icon: '💪', color: '#6B4FC8', bg: '#F0ECFB' },
                  ].map(m => (
                    <div key={m.label} style={{ background: m.bg, borderRadius: '14px', padding: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '24px' }}>{m.icon}</span>
                      <div>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: m.color }}>{m.value}</div>
                        <div style={{ fontSize: '10px', color: '#7A8FA8' }}>{m.label}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Şüpheli uyarı */}
                {suspiciousCount > 0 && (
                  <div style={{ background: '#FDF4E7', borderRadius: '12px', padding: '14px 16px', marginBottom: '14px', border: '1px solid #FED7AA', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '22px' }}>⚠️</span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#B45309' }}>{suspiciousCount} görev incelemede</div>
                      <div style={{ fontSize: '11px', color: '#7A8FA8' }}>Öğretmen değerlendirmesi bekleniyor</div>
                    </div>
                  </div>
                )}

                {/* Son öğretmen notları */}
                {calendarNotes.length > 0 && (
                  <div style={{ background: '#fff', borderRadius: '14px', overflow: 'hidden', marginBottom: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #F0F4F9', fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>
                      👨‍🏫 Son Öğretmen Notları
                    </div>
                    {calendarNotes.slice(0, 3).map((note, i) => (
                      <div key={note.id} style={{ padding: '12px 16px', borderBottom: i < Math.min(calendarNotes.length, 3) - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '18px', padding: '4px 8px', borderRadius: '8px', background: evalStyle[note.evaluation]?.bg, flexShrink: 0 }}>
                          {evalStyle[note.evaluation]?.icon}
                        </span>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: evalStyle[note.evaluation]?.color }}>{evalStyle[note.evaluation]?.label}</span>
                            <span style={{ fontSize: '10px', color: '#9CA3AF' }}>
                              {new Date(note.calendar_date + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                          <div style={{ fontSize: '12.5px', color: '#374151', lineHeight: 1.6 }}>{note.note}</div>
                          <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '4px' }}>{note.profiles?.full_name}</div>
                        </div>
                      </div>
                    ))}
                    {calendarNotes.length > 3 && (
                      <div onClick={() => setActiveTab('calendar')} style={{ padding: '10px 16px', textAlign: 'center', fontSize: '12px', color: '#6B4FC8', fontWeight: 600, cursor: 'pointer', borderTop: '1px solid #F0F4F9' }}>
                        Tümünü Takvimde Gör →
                      </div>
                    )}
                  </div>
                )}

                {/* Bugünün takvim görevleri */}
                {getCalForDate(todayStr).length > 0 && (
                  <div style={{ background: '#fff', borderRadius: '14px', overflow: 'hidden', marginBottom: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #F0F4F9', fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>
                      📅 Bugünün Çalışma Programı
                    </div>
                    {getCalForDate(todayStr).map((item, i) => {
                      const isDone = item.status === 'completed'
                      return (
                        <div key={item.id} style={{ padding: '12px 16px', borderBottom: i < getCalForDate(todayStr).length - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', alignItems: 'center', gap: '12px', background: isDone ? '#F8FFF8' : '#fff' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: isDone ? '#EAF4EE' : '#EEF3FB', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {isDone ? <span style={{ fontSize: '18px', color: '#2E7D52' }}>✓</span> : <><div style={{ fontSize: '11px', fontWeight: 800, color: '#1B3A6B' }}>{item.duration_minutes}</div><div style={{ fontSize: '8px', color: '#7A8FA8' }}>dk</div></>}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: isDone ? '#7A8FA8' : '#1B3A6B', textDecoration: isDone ? 'line-through' : 'none', marginBottom: '2px' }}>{item.title}</div>
                            <div style={{ fontSize: '11px', color: '#7A8FA8' }}>{item.subjects?.name}{item.topics?.name ? ' — ' + item.topics.name : ''}</div>
                            {isDone && item.is_suspicious && item.teacher_approved === null && (
                              <div style={{ fontSize: '10px', color: '#B45309', marginTop: '2px' }}>⏳ Öğretmen değerlendiriyor</div>
                            )}
                            {isDone && item.teacher_approved === true && (
                              <div style={{ fontSize: '10px', color: '#2E7D52', marginTop: '2px' }}>✓ Öğretmen onayladı</div>
                            )}
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: isDone ? '#EAF4EE' : '#EEF3FB', color: isDone ? '#2E7D52' : '#1B3A6B', flexShrink: 0 }}>
                            {isDone ? 'Yaptı ✓' : 'Bekliyor'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Zayıf konular */}
                {weakTopics.length > 0 && (
                  <div style={{ background: '#FEF2F2', borderRadius: '14px', padding: '14px 16px', border: '1px solid #FEE2E2' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#C0392B', marginBottom: '10px' }}>⚠️ Dikkat Gerektiren Konular</div>
                    {weakTopics.slice(0, 3).map(t => (
                      <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(0,0,0,0.05)', fontSize: '12.5px' }}>
                        <span style={{ color: '#374151' }}>{t.subjects?.name} — {t.topics?.name ?? 'Genel'}</span>
                        <strong style={{ color: '#C0392B' }}>%{Math.round(t.accuracy_rate)}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── TAKVİM ── */}
            {activeTab === 'calendar' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#1B3A6B' }}>🗓 Çalışma Takvimi</div>
                  <div style={{ display: 'flex', gap: '4px', background: '#F0F4F9', borderRadius: '8px', padding: '3px' }}>
                    {(['week', 'month'] as const).map(v => (
                      <button key={v} onClick={() => setCalendarView(v)} style={{ padding: '5px 12px', borderRadius: '6px', border: 'none', background: calendarView === v ? '#fff' : 'transparent', color: calendarView === v ? '#1B3A6B' : '#9CA3AF', fontSize: '12px', fontWeight: calendarView === v ? 700 : 500, cursor: 'pointer' }}>
                        {v === 'week' ? 'Hafta' : 'Ay'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Haftalık */}
                {calendarView === 'week' && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <button onClick={() => { const d = new Date(currentWeekStart); d.setDate(d.getDate() - 7); setCurrentWeekStart(d) }} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #D5DFF0', background: '#fff', cursor: 'pointer', fontSize: '16px' }}>‹</button>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#1B3A6B' }}>
                        {currentWeekStart.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} — {weekDays[6].toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                      </span>
                      <button onClick={() => { const d = new Date(currentWeekStart); d.setDate(d.getDate() + 7); setCurrentWeekStart(d) }} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #D5DFF0', background: '#fff', cursor: 'pointer', fontSize: '16px' }}>›</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '4px', marginBottom: '14px' }}>
                      {weekDays.map((day, i) => {
                        const dateStr = ds(day)
                        const items = getCalForDate(dateStr)
                        const note = getNoteForDate(dateStr)
                        const isToday = dateStr === todayStr
                        const isSelected = dateStr === selectedDate
                        const completedCount = items.filter(x => x.status === 'completed').length
                        return (
                          <button key={i} onClick={() => setSelectedDate(dateStr)} style={{ padding: '7px 3px', borderRadius: '10px', border: '2px solid', borderColor: isSelected ? '#6B4FC8' : isToday ? '#C4B5FD' : '#E2EAF8', background: isSelected ? '#6B4FC8' : isToday ? '#F5F3FF' : '#fff', cursor: 'pointer', textAlign: 'center' }}>
                            <div style={{ fontSize: '9px', color: isSelected ? 'rgba(255,255,255,0.7)' : '#9CA3AF', marginBottom: '2px' }}>{DAYS_SHORT[i]}</div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: isSelected ? '#fff' : isToday ? '#6B4FC8' : '#374151' }}>{day.getDate()}</div>
                            {items.length > 0 && (
                              <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', marginTop: '3px' }}>
                                {items.slice(0, 3).map((_, idx) => (
                                  <div key={idx} style={{ width: '5px', height: '5px', borderRadius: '50%', background: idx < completedCount ? '#2E7D52' : (isSelected ? 'rgba(255,255,255,0.5)' : '#A78BFA') }} />
                                ))}
                              </div>
                            )}
                            {note && <div style={{ fontSize: '9px', marginTop: '1px' }}>{note.evaluation === 'good' ? '✓' : note.evaluation === 'warning' ? '⚠' : '✗'}</div>}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Aylık */}
                {calendarView === 'month' && (
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <button onClick={() => { const d = new Date(currentMonth); d.setMonth(d.getMonth() - 1); setCurrentMonth(d) }} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #D5DFF0', background: '#fff', cursor: 'pointer', fontSize: '16px' }}>‹</button>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#1B3A6B' }}>{MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
                      <button onClick={() => { const d = new Date(currentMonth); d.setMonth(d.getMonth() + 1); setCurrentMonth(d) }} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #D5DFF0', background: '#fff', cursor: 'pointer', fontSize: '16px' }}>›</button>
                    </div>
                    <div style={{ background: '#fff', borderRadius: '14px', padding: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '2px', marginBottom: '6px' }}>
                        {DAYS_SHORT.map(d => <div key={d} style={{ textAlign: 'center', fontSize: '9px', fontWeight: 700, color: '#9CA3AF', padding: '3px 0' }}>{d}</div>)}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '3px' }}>
                        {monthDays.map((day, i) => {
                          if (!day) return <div key={i} />
                          const dateStr = ds(day)
                          const items = getCalForDate(dateStr)
                          const note = getNoteForDate(dateStr)
                          const isToday = dateStr === todayStr
                          const isSelected = dateStr === selectedDate
                          const completedCount = items.filter(x => x.status === 'completed').length
                          return (
                            <button key={i} onClick={() => setSelectedDate(dateStr)} style={{ padding: '5px 2px', borderRadius: '8px', border: '2px solid', borderColor: isSelected ? '#6B4FC8' : isToday ? '#C4B5FD' : 'transparent', background: isSelected ? '#6B4FC8' : isToday ? '#F5F3FF' : 'transparent', cursor: 'pointer', textAlign: 'center' }}>
                              <div style={{ fontSize: '12px', fontWeight: isToday ? 800 : 500, color: isSelected ? '#fff' : '#374151' }}>{day.getDate()}</div>
                              {items.length > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '1px', marginTop: '2px' }}>
                                  {items.slice(0, 3).map((_, idx) => (
                                    <div key={idx} style={{ width: '4px', height: '4px', borderRadius: '50%', background: idx < completedCount ? '#2E7D52' : (isSelected ? 'rgba(255,255,255,0.5)' : '#A78BFA') }} />
                                  ))}
                                </div>
                              )}
                              {note && <div style={{ fontSize: '9px' }}>{note.evaluation === 'good' ? '✓' : note.evaluation === 'warning' ? '⚠' : '✗'}</div>}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Seçili gün detayı */}
                <div style={{ background: '#fff', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '14px' }}>
                  <div style={{ padding: '12px 16px', background: '#F8FAFF', borderBottom: '1px solid #F0F4F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>
                      {new Date(selectedDate + 'T12:00:00').toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </div>
                    {selectedNote && (
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: evalStyle[selectedNote.evaluation]?.bg, color: evalStyle[selectedNote.evaluation]?.color }}>
                        {evalStyle[selectedNote.evaluation]?.label}
                      </span>
                    )}
                  </div>

                  {/* Öğretmen notu */}
                  {selectedNote?.note && (
                    <div style={{ padding: '12px 16px', background: '#F5F3FF', borderBottom: '1px solid #EDE9FE', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '16px' }}>👨‍🏫</span>
                      <div>
                        <div style={{ fontSize: '10px', color: '#7A8FA8', marginBottom: '3px' }}>
                          Öğretmen Notu — {selectedNote.profiles?.full_name}
                        </div>
                        <div style={{ fontSize: '12.5px', color: '#1B3A6B', lineHeight: 1.6 }}>{selectedNote.note}</div>
                      </div>
                    </div>
                  )}

                  {selectedItems.length === 0 ? (
                    <div style={{ padding: '28px', textAlign: 'center', color: '#7A8FA8', fontSize: '13px' }}>Bu gün için çalışma yok</div>
                  ) : selectedItems.map((item, i) => {
                    const isDone = item.status === 'completed'
                    return (
                      <div key={item.id} style={{ padding: '13px 16px', borderBottom: i < selectedItems.length - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', alignItems: 'center', gap: '12px', background: isDone ? '#F8FFF8' : '#fff' }}>
                        <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: isDone ? '#EAF4EE' : '#EEF3FB', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {isDone ? <span style={{ fontSize: '18px', color: '#2E7D52' }}>✓</span> : <><div style={{ fontSize: '12px', fontWeight: 800, color: '#1B3A6B' }}>{item.duration_minutes}</div><div style={{ fontSize: '8px', color: '#7A8FA8' }}>dk</div></>}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: isDone ? '#7A8FA8' : '#1B3A6B', textDecoration: isDone ? 'line-through' : 'none', marginBottom: '2px' }}>{item.title}</div>
                          <div style={{ fontSize: '11px', color: '#7A8FA8' }}>{item.subjects?.name}{item.topics?.name ? ' — ' + item.topics.name : ''}{item.question_count > 0 ? ' · ' + item.question_count + ' soru' : ''}</div>
                          {isDone && item.is_suspicious && item.teacher_approved === null && <div style={{ fontSize: '10px', color: '#B45309', marginTop: '2px' }}>⏳ Öğretmen değerlendiriyor</div>}
                          {isDone && item.teacher_approved === true && <div style={{ fontSize: '10px', color: '#2E7D52', marginTop: '2px' }}>✓ Öğretmen onayladı</div>}
                          {isDone && item.teacher_approved === false && <div style={{ fontSize: '10px', color: '#C0392B', marginTop: '2px' }}>✗ Öğretmen reddetti</div>}
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: isDone ? '#EAF4EE' : '#EEF3FB', color: isDone ? '#2E7D52' : '#1B3A6B', flexShrink: 0 }}>
                          {isDone ? 'Yaptı ✓' : 'Bekliyor'}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* O haftanın notları */}
                {calendarNotes.length > 0 && (
                  <div style={{ background: '#fff', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #F0F4F9', fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>
                      👨‍🏫 Tüm Öğretmen Notları
                    </div>
                    {calendarNotes.slice(0, 10).map((note, i) => (
                      <div key={note.id} style={{ padding: '12px 16px', borderBottom: i < Math.min(calendarNotes.length, 10) - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: evalStyle[note.evaluation]?.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>
                          {evalStyle[note.evaluation]?.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: evalStyle[note.evaluation]?.color }}>{evalStyle[note.evaluation]?.label}</span>
                            <span style={{ fontSize: '10px', color: '#9CA3AF' }}>
                              {new Date(note.calendar_date + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#374151', lineHeight: 1.6 }}>{note.note}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── PERFORMANS ── */}
            {activeTab === 'performance' && (
              <div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#1B3A6B', marginBottom: '14px' }}>📊 {selectedChild.full_name?.split(' ')[0]}'in Performansı</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '14px' }}>
                  {[
                    { label: 'Genel', value: '%' + overallRate, color: overallRate >= 70 ? '#2E7D52' : overallRate >= 50 ? '#B45309' : '#C0392B', bg: overallRate >= 70 ? '#EAF4EE' : overallRate >= 50 ? '#FDF4E7' : '#FEF2F2' },
                    { label: 'Güçlü', value: strongTopics.length, color: '#2E7D52', bg: '#EAF4EE' },
                    { label: 'Zayıf', value: weakTopics.length, color: '#C0392B', bg: '#FEF2F2' },
                  ].map(m => (
                    <div key={m.label} style={{ background: m.bg, borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
                      <div style={{ fontSize: '22px', fontWeight: 800, color: m.color }}>{m.value}</div>
                      <div style={{ fontSize: '10px', color: '#7A8FA8', marginTop: '3px' }}>{m.label}</div>
                    </div>
                  ))}
                </div>
                {topicPerf.length === 0 ? (
                  <div style={{ background: '#F8FAFF', borderRadius: '12px', padding: '32px', textAlign: 'center', color: '#7A8FA8' }}>Henüz veri yok</div>
                ) : topicPerf.map(t => {
                  const color = t.accuracy_rate >= 70 ? '#2E7D52' : t.accuracy_rate >= 50 ? '#B45309' : '#C0392B'
                  return (
                    <div key={t.id} style={{ background: '#fff', borderRadius: '12px', padding: '12px 14px', marginBottom: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>{t.topics?.name ?? 'Genel'}</div>
                          <div style={{ fontSize: '11px', color: '#7A8FA8' }}>{t.subjects?.name}</div>
                        </div>
                        <span style={{ fontSize: '18px', fontWeight: 800, color }}>%{Math.round(t.accuracy_rate)}</span>
                      </div>
                      <div style={{ height: '6px', background: '#F0F4F9', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: Math.min(t.accuracy_rate, 100) + '%', background: color, borderRadius: '3px' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* ── ÖDEVLER ── */}
            {activeTab === 'homework' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#1B3A6B' }}>📚 Ödevler</div>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', background: '#FDF4E7', color: '#B45309', fontWeight: 600 }}>{pendingHw} bekliyor</span>
                    <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', background: '#EAF4EE', color: '#2E7D52', fontWeight: 600 }}>{homework.filter(h => h.status === 'completed').length} tamam</span>
                  </div>
                </div>
                {homework.length === 0 ? (
                  <div style={{ background: '#F8FAFF', borderRadius: '12px', padding: '32px', textAlign: 'center', color: '#7A8FA8' }}>Henüz ödev yok</div>
                ) : homework.map(h => {
                  const isDone = h.status === 'completed'
                  const isLate = !isDone && h.deadline && new Date(h.deadline) < new Date()
                  return (
                    <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '13px', marginBottom: '8px', borderRadius: '14px', background: '#fff', border: '1px solid', borderColor: isDone ? '#D1FAE5' : isLate ? '#FECACA' : '#E2EAF8' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: isDone ? '#EAF4EE' : isLate ? '#FEF2F2' : '#EEF3FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                        {isDone ? '✅' : isLate ? '⏰' : '📝'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', textDecoration: isDone ? 'line-through' : 'none', marginBottom: '2px' }}>{h.tests?.name}</div>
                        <div style={{ fontSize: '11px', color: '#7A8FA8' }}>{h.tests?.chapters?.books?.name}</div>
                        {h.deadline && <div style={{ fontSize: '10px', color: isLate ? '#C0392B' : '#7A8FA8', marginTop: '2px' }}>Son teslim: {new Date(h.deadline).toLocaleDateString('tr-TR')}</div>}
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', background: isDone ? '#EAF4EE' : isLate ? '#FEF2F2' : '#FDF4E7', color: isDone ? '#2E7D52' : isLate ? '#C0392B' : '#B45309', flexShrink: 0 }}>
                        {isDone ? 'Tamam' : isLate ? 'Gecikti!' : 'Bekliyor'}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}

          </>
        )}
      </div>
    </div>
  )
}