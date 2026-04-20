'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// ─── SVG İKONLAR ─────────────────────────────────────────────
const Icon = {
  dashboard: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  calendar: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  chart: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
  book: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>,
  flag: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>,
  alert: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  check: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  clock: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  user: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  logout: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  trending: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
}

// Kurumsal pastel palet — veli için mor/indigo ağırlıklı
const P = {
  primary: '#4C1D95', primaryLight: '#EDE9FE', primaryBorder: '#C4B5FD',
  navy: '#1B3A6B', navyLight: '#EEF3FB',
  green: '#14532D', greenLight: '#DCFCE7', greenBorder: '#86EFAC',
  amber: '#78350F', amberLight: '#FEF3C7', amberBorder: '#FCD34D',
  red: '#7F1D1D', redLight: '#FEF2F2', redBorder: '#FECACA',
  slate: '#475569', slateLight: '#F1F5F9',
  bg: '#F8FAFC', white: '#FFFFFF',
  border: '#E2E8F0', text: '#1E293B', muted: '#94A3B8',
}

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
  const [holidays, setHolidays] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))
  const [calendarView, setCalendarView] = useState<'week' | 'month'>('week')
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getMonday(new Date()))
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const supabase = createClient()

  function getMonday(d: Date) {
    const date = new Date(d); const day = date.getDay()
    date.setDate(date.getDate() - day + (day === 0 ? -6 : 1)); date.setHours(0,0,0,0); return date
  }

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    const { data: p } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()
    if (!p) { setLoading(false); return }
    setProfile(p)
    const { data: ps } = await supabase.from('parent_students').select('student_id, profiles!parent_students_student_id_fkey(id, full_name, grade_level, classroom_id)').eq('parent_id', p.id)
    const kids = (ps ?? []).map((x: any) => x.profiles).filter(Boolean)
    const { data: classroomData } = await supabase.from('classrooms').select('id, name')
    const { data: hols } = await supabase.from('public_holidays').select('*').order('holiday_date')
    const classroomMap: Record<string, string> = {}
    for (const c of classroomData ?? []) classroomMap[c.id] = c.name
    const kidsWithClass = kids.map((k: any) => ({ ...k, classroom_name: k.classroom_id ? classroomMap[k.classroom_id] ?? null : null }))
    setChildren(kidsWithClass)
    setHolidays(hols ?? [])
    if (kidsWithClass.length > 0) { setSelectedChild(kidsWithClass[0]); await loadChildData(kidsWithClass[0].id) }
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
    setTopicPerf(tp ?? []); setHomework(hw ?? []); setStreak(st)
    setGoals(g ?? []); setCalendar(cal ?? []); setCalendarNotes(notes ?? [])
  }

  async function switchChild(child: any) {
    setSelectedChild(child); setLoading(true)
    await loadChildData(child.id); setLoading(false)
  }

  async function signOut() { await supabase.auth.signOut(); window.location.href = '/login' }

  function getWeekDays(start: Date) { return Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d }) }
  function getMonthDays(date: Date) {
    const year = date.getFullYear(), month = date.getMonth()
    const firstDay = new Date(year, month, 1), lastDay = new Date(year, month + 1, 0)
    const startPad = (firstDay.getDay() + 6) % 7
    const days: (Date | null)[] = []
    for (let i = 0; i < startPad; i++) days.push(null)
    for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i))
    return days
  }
  function ds(d: Date) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  function getCalForDate(dateStr: string) { return calendar.filter(c => c.calendar_date === dateStr) }
  function getNoteForDate(dateStr: string) { return calendarNotes.find(n => n.calendar_date === dateStr) }
  function getHoliday(dateStr: string) { return holidays.find(h => h.holiday_date === dateStr) }

  const weekDays = getWeekDays(currentWeekStart)
  const monthDays = getMonthDays(currentMonth)
  const todayStr = new Date().toISOString().slice(0, 10)
  const selectedItems = getCalForDate(selectedDate)
  const selectedNote = getNoteForDate(selectedDate)
  const selectedHoliday = getHoliday(selectedDate)
  const DAYS_SHORT = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
  const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']

  const evalCfg: any = {
    good: { bg: P.greenLight, color: P.green, border: P.greenBorder, label: 'Yeterli' },
    warning: { bg: P.amberLight, color: P.amber, border: P.amberBorder, label: 'Dikkat Gerekiyor' },
    insufficient: { bg: P.redLight, color: P.red, border: P.redBorder, label: 'Yetersiz' },
  }

  const totalQ = topicPerf.reduce((s, t) => s + t.total_questions, 0)
  const totalC = topicPerf.reduce((s, t) => s + t.correct_count, 0)
  const overallRate = totalQ > 0 ? Math.round(totalC / totalQ * 100) : 0
  const pendingHw = homework.filter(h => h.status !== 'completed').length
  const weakTopics = topicPerf.filter(t => t.accuracy_rate < 50)
  const strongTopics = topicPerf.filter(t => t.accuracy_rate >= 70)
  const suspiciousCount = calendar.filter(c => c.is_suspicious && c.teacher_approved === null).length

  const thisWeek = getWeekDays(getMonday(new Date()))
  const thisWeekCalendar = calendar.filter(c => {
    const d = c.calendar_date
    return d >= ds(thisWeek[0]) && d <= ds(thisWeek[6])
  })
  const thisWeekDone = thisWeekCalendar.filter(c => c.status === 'completed').length

  const TABS = [
    { id: 'dashboard', label: 'Genel Bakış', Icon: Icon.dashboard },
    { id: 'calendar', label: 'Takvim', Icon: Icon.calendar },
    { id: 'performance', label: 'Performans', Icon: Icon.chart },
    { id: 'homework', label: 'Ödevler', Icon: Icon.book },
  ]

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: P.bg }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: P.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: P.primary }}><Icon.user /></div>
        <div style={{ fontSize: '13px', color: P.muted }}>Yükleniyor...</div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: P.bg, fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", sans-serif' }}>

      {/* Header */}
      <div style={{ background: P.white, borderBottom: '1px solid ' + P.border, padding: '0 16px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: P.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><rect x="1" y="1" width="7" height="7" rx="1.5" fill="white"/><rect x="10" y="1" width="7" height="7" rx="1.5" fill="white" opacity=".4"/><rect x="1" y="10" width="7" height="7" rx="1.5" fill="white" opacity=".4"/><rect x="10" y="10" width="7" height="7" rx="1.5" fill="white"/></svg>
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: P.text }}>DershaneOPS</div>
            <div style={{ fontSize: '10px', color: P.muted }}>Veli Paneli</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: P.slate, padding: '5px 10px', background: P.slateLight, borderRadius: '6px' }}>{profile?.full_name?.split(' ')[0]}</div>
          <button onClick={signOut} style={{ background: 'transparent', border: '1px solid ' + P.border, borderRadius: '6px', padding: '6px 8px', color: P.slate, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <Icon.logout />
          </button>
        </div>
      </div>

      {/* Çocuk seçici */}
      {children.length > 1 && (
        <div style={{ background: P.white, padding: '10px 16px', display: 'flex', gap: '8px', overflowX: 'auto', borderBottom: '1px solid ' + P.border }}>
          {children.map(child => (
            <button key={child.id} onClick={() => switchChild(child)}
              style={{ padding: '6px 14px', borderRadius: '20px', border: '1.5px solid', borderColor: selectedChild?.id === child.id ? P.primary : P.border, background: selectedChild?.id === child.id ? P.primaryLight : P.white, color: selectedChild?.id === child.id ? P.primary : P.muted, fontSize: '12px', fontWeight: selectedChild?.id === child.id ? 700 : 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {child.full_name?.split(' ')[0]}{child.grade_level ? ' · ' + child.grade_level + '. Sınıf' : ''}
            </button>
          ))}
        </div>
      )}

      {/* Alt Tab Bar */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: P.white, borderTop: '1px solid ' + P.border, display: 'flex', zIndex: 100, paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flex: 1, padding: '8px 4px 10px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', position: 'relative' }}>
            <span style={{ color: activeTab === tab.id ? P.primary : P.muted }}><tab.Icon /></span>
            <span style={{ fontSize: '9px', fontWeight: activeTab === tab.id ? 700 : 500, color: activeTab === tab.id ? P.primary : P.muted }}>{tab.label}</span>
            {activeTab === tab.id && <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '24px', height: '2px', background: P.primary, borderRadius: '2px 2px 0 0' }} />}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px 16px 80px' }}>
        {!selectedChild ? (
          <div style={{ background: P.white, borderRadius: '12px', padding: '40px', textAlign: 'center', border: '1px solid ' + P.border }}>
            <div style={{ color: P.muted, display: 'flex', justifyContent: 'center', marginBottom: '10px' }}><Icon.user /></div>
            <div style={{ fontSize: '13px', color: P.muted }}>Kayıtlı öğrenci bulunamadı</div>
          </div>
        ) : (
          <>

            {/* ── GENEL BAKIŞ ── */}
            {activeTab === 'dashboard' && (
              <div>
                {/* Öğrenci kartı */}
                <div style={{ background: P.white, borderRadius: '12px', padding: '16px', marginBottom: '14px', border: '1px solid ' + P.border, display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: P.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: P.primary, flexShrink: 0, fontSize: '20px', fontWeight: 800 }}>
                    {selectedChild.full_name?.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: P.text }}>{selectedChild.full_name}</div>
                    <div style={{ fontSize: '11px', color: P.muted, marginTop: '2px' }}>
                      {selectedChild.grade_level ? selectedChild.grade_level + '. Sınıf' : ''}{selectedChild.classroom_name ? ' · ' + selectedChild.classroom_name : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: overallRate >= 70 ? P.green : overallRate >= 50 ? P.amber : P.red }}>%{overallRate}</div>
                    <div style={{ fontSize: '10px', color: P.muted }}>Genel başarı</div>
                  </div>
                </div>

                {/* Özet metrikler */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '10px', marginBottom: '14px' }}>
                  {[
                    { label: 'Çalışma Serisi', value: (streak?.current_streak ?? 0) + ' gün', Icon: Icon.trending, color: P.primary, bg: P.primaryLight, border: P.primaryBorder },
                    { label: 'Bu Hafta Görev', value: thisWeekDone + '/' + thisWeekCalendar.length, Icon: Icon.check, color: P.green, bg: P.greenLight, border: P.greenBorder },
                    { label: 'Bekleyen Ödev', value: String(pendingHw), Icon: Icon.clock, color: pendingHw > 0 ? P.amber : P.green, bg: pendingHw > 0 ? P.amberLight : P.greenLight, border: pendingHw > 0 ? P.amberBorder : P.greenBorder },
                    { label: 'Güçlü Konu', value: String(strongTopics.length), Icon: Icon.chart, color: P.navy, bg: P.navyLight, border: '#BFDBFE' },
                  ].map(m => (
                    <div key={m.label} style={{ background: P.white, borderRadius: '10px', padding: '13px', border: '1px solid ' + P.border, display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: m.bg, border: '1px solid ' + m.border, display: 'flex', alignItems: 'center', justifyContent: 'center', color: m.color, flexShrink: 0 }}>
                        <m.Icon />
                      </div>
                      <div>
                        <div style={{ fontSize: '20px', fontWeight: 700, color: P.text, lineHeight: 1 }}>{m.value}</div>
                        <div style={{ fontSize: '10px', color: P.muted, marginTop: '3px' }}>{m.label}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Şüpheli uyarı */}
                {suspiciousCount > 0 && (
                  <div style={{ background: P.amberLight, borderRadius: '10px', padding: '12px 14px', marginBottom: '14px', border: '1px solid ' + P.amberBorder, display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{ color: P.amber, marginTop: '1px' }}><Icon.alert /></span>
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: P.amber }}>{suspiciousCount} görev öğretmen değerlendirmesini bekliyor</div>
                      <div style={{ fontSize: '11px', color: P.muted, marginTop: '2px' }}>Öğretmen incelemesi tamamlandığında bildirim alacaksınız.</div>
                    </div>
                  </div>
                )}

                {/* Son öğretmen notları */}
                {calendarNotes.length > 0 && (
                  <div style={{ background: P.white, borderRadius: '12px', overflow: 'hidden', marginBottom: '14px', border: '1px solid ' + P.border }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid ' + P.border, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: P.text }}>Öğretmen Değerlendirmeleri</div>
                      <div style={{ fontSize: '10px', color: P.muted }}>Son {Math.min(calendarNotes.length, 3)} not</div>
                    </div>
                    {calendarNotes.slice(0, 3).map((note, i) => (
                      <div key={note.id} style={{ padding: '12px 16px', borderBottom: i < Math.min(calendarNotes.length, 3) - 1 ? '1px solid ' + P.border : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: evalCfg[note.evaluation]?.bg, color: evalCfg[note.evaluation]?.color, border: '1px solid ' + evalCfg[note.evaluation]?.border, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                            {evalCfg[note.evaluation]?.label}
                          </span>
                          <span style={{ fontSize: '10px', color: P.muted }}>
                            {new Date(note.calendar_date + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                          </span>
                        </div>
                        <div style={{ fontSize: '12.5px', color: P.text, lineHeight: 1.7 }}>{note.note}</div>
                        <div style={{ fontSize: '10px', color: P.muted, marginTop: '4px' }}>{note.profiles?.full_name}</div>
                      </div>
                    ))}
                    {calendarNotes.length > 3 && (
                      <div onClick={() => setActiveTab('calendar')} style={{ padding: '10px 16px', textAlign: 'center', fontSize: '11px', fontWeight: 600, color: P.primary, cursor: 'pointer', borderTop: '1px solid ' + P.border, background: P.primaryLight }}>
                        Tüm Değerlendirmeleri Gör →
                      </div>
                    )}
                  </div>
                )}

                {/* Bugünün programı */}
                {getCalForDate(todayStr).length > 0 && (
                  <div style={{ background: P.white, borderRadius: '12px', overflow: 'hidden', marginBottom: '14px', border: '1px solid ' + P.border }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid ' + P.border, fontSize: '12px', fontWeight: 700, color: P.text }}>
                      Bugünün Çalışma Programı
                    </div>
                    {getCalForDate(todayStr).map((item, i) => {
                      const isDone = item.status === 'completed'
                      return (
                        <div key={item.id} style={{ padding: '11px 16px', borderBottom: i < getCalForDate(todayStr).length - 1 ? '1px solid ' + P.border : 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: isDone ? P.greenLight : P.slateLight, border: '1px solid ' + (isDone ? P.greenBorder : P.border), display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDone ? P.green : P.slate, flexShrink: 0 }}>
                            {isDone ? <Icon.check /> : <Icon.clock />}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '12.5px', fontWeight: 600, color: isDone ? P.muted : P.text, textDecoration: isDone ? 'line-through' : 'none', marginBottom: '2px' }}>{item.title}</div>
                            <div style={{ fontSize: '10px', color: P.muted }}>{item.subjects?.name}{item.topics?.name ? ' · ' + item.topics.name : ''} · {item.duration_minutes} dk</div>
                            {isDone && item.teacher_approved === null && item.is_suspicious && <div style={{ fontSize: '10px', color: P.amber, marginTop: '2px' }}>Öğretmen değerlendiriyor</div>}
                            {isDone && item.teacher_approved === true && <div style={{ fontSize: '10px', color: P.green, marginTop: '2px' }}>Öğretmen tarafından onaylandı</div>}
                          </div>
                          <span style={{ fontSize: '10px', fontWeight: 600, padding: '3px 9px', borderRadius: '5px', background: isDone ? P.greenLight : P.slateLight, color: isDone ? P.green : P.slate, border: '1px solid ' + (isDone ? P.greenBorder : P.border), flexShrink: 0 }}>
                            {isDone ? 'Tamamlandı' : 'Bekliyor'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Dikkat gerektiren konular */}
                {weakTopics.length > 0 && (
                  <div style={{ background: P.white, borderRadius: '12px', overflow: 'hidden', border: '1px solid ' + P.redBorder }}>
                    <div style={{ padding: '11px 16px', borderBottom: '1px solid ' + P.redBorder, background: P.redLight, fontSize: '12px', fontWeight: 700, color: P.red, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Icon.alert /> Dikkat Gerektiren Konular
                    </div>
                    {weakTopics.slice(0, 4).map((t, i) => (
                      <div key={t.id} style={{ padding: '10px 16px', borderBottom: i < Math.min(weakTopics.length, 4) - 1 ? '1px solid ' + P.border : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: P.text }}>{t.topics?.name ?? 'Genel'}</div>
                          <div style={{ fontSize: '10px', color: P.muted }}>{t.subjects?.name}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '16px', fontWeight: 700, color: P.red }}>%{Math.round(t.accuracy_rate)}</div>
                          <div style={{ height: '4px', width: '60px', background: P.border, borderRadius: '2px', overflow: 'hidden', marginTop: '4px' }}>
                            <div style={{ height: '100%', width: Math.min(t.accuracy_rate, 100) + '%', background: P.red, borderRadius: '2px' }} />
                          </div>
                        </div>
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
                  <div style={{ fontSize: '15px', fontWeight: 700, color: P.text }}>{selectedChild.full_name?.split(' ')[0]}'in Çalışma Takvimi</div>
                  <div style={{ display: 'flex', gap: '2px', background: P.slateLight, borderRadius: '7px', padding: '3px' }}>
                    {(['week', 'month'] as const).map(v => (
                      <button key={v} onClick={() => setCalendarView(v)} style={{ padding: '5px 12px', borderRadius: '5px', border: 'none', background: calendarView === v ? P.white : 'transparent', color: calendarView === v ? P.primary : P.muted, fontSize: '11px', fontWeight: calendarView === v ? 700 : 500, cursor: 'pointer', boxShadow: calendarView === v ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}>
                        {v === 'week' ? 'Haftalık' : 'Aylık'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tatil açıklama bandı */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                  {[
                    { color: '#1B3A6B', bg: '#EEF3FB', label: 'Resmi Tatil' },
                    { color: '#14532D', bg: '#DCFCE7', label: 'Dini Bayram' },
                    { color: '#4C1D95', bg: '#EDE9FE', label: 'Okul Tatili' },
                  ].map(h => (
                    <div key={h.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: h.bg, border: '1.5px solid ' + h.color }} />
                      <span style={{ fontSize: '10px', color: P.muted }}>{h.label}</span>
                    </div>
                  ))}
                </div>

                {/* Haftalık görünüm */}
                {calendarView === 'week' && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <button onClick={() => { const d = new Date(currentWeekStart); d.setDate(d.getDate() - 7); setCurrentWeekStart(d) }} style={{ padding: '6px 14px', borderRadius: '7px', border: '1px solid ' + P.border, background: P.white, cursor: 'pointer', fontSize: '14px', color: P.slate }}>‹</button>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: P.text }}>{currentWeekStart.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} — {weekDays[6].toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</span>
                      <button onClick={() => { const d = new Date(currentWeekStart); d.setDate(d.getDate() + 7); setCurrentWeekStart(d) }} style={{ padding: '6px 14px', borderRadius: '7px', border: '1px solid ' + P.border, background: P.white, cursor: 'pointer', fontSize: '14px', color: P.slate }}>›</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '4px', marginBottom: '14px' }}>
                      {weekDays.map((day, i) => {
                        const dateStr = ds(day); const items = getCalForDate(dateStr)
                        const note = getNoteForDate(dateStr); const holiday = getHoliday(dateStr)
                        const isToday = dateStr === todayStr; const isSelected = dateStr === selectedDate
                        const isWeekend = i >= 5
                        const completedCount = items.filter(x => x.status === 'completed').length
                        return (
                          <button key={i} onClick={() => setSelectedDate(dateStr)}
                            style={{ padding: '7px 3px', borderRadius: '8px', border: '1.5px solid', borderColor: isSelected ? P.primary : holiday ? holiday.color : isToday ? P.primaryBorder : P.border, background: isSelected ? P.primary : holiday ? holiday.color + '18' : isToday ? P.primaryLight : isWeekend ? P.slateLight : P.white, cursor: 'pointer', textAlign: 'center' }}>
                            <div style={{ fontSize: '8px', color: isSelected ? 'rgba(255,255,255,0.6)' : P.muted, marginBottom: '2px' }}>{DAYS_SHORT[i]}</div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: isSelected ? '#fff' : isToday ? P.primary : P.text }}>{day.getDate()}</div>
                            {holiday && !isSelected && <div style={{ width: '6px', height: '2px', borderRadius: '1px', background: holiday.color, margin: '2px auto 0' }} />}
                            {items.length > 0 && (
                              <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', marginTop: '2px' }}>
                                {items.slice(0, 3).map((_, idx) => (
                                  <div key={idx} style={{ width: '4px', height: '4px', borderRadius: '50%', background: idx < completedCount ? P.green : (isSelected ? 'rgba(255,255,255,0.5)' : P.primaryBorder) }} />
                                ))}
                              </div>
                            )}
                            {note && <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: evalCfg[note.evaluation]?.color, margin: '2px auto 0' }} />}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Aylık görünüm */}
                {calendarView === 'month' && (
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <button onClick={() => { const d = new Date(currentMonth); d.setMonth(d.getMonth() - 1); setCurrentMonth(d) }} style={{ padding: '6px 14px', borderRadius: '7px', border: '1px solid ' + P.border, background: P.white, cursor: 'pointer', fontSize: '14px', color: P.slate }}>‹</button>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: P.text }}>{MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
                      <button onClick={() => { const d = new Date(currentMonth); d.setMonth(d.getMonth() + 1); setCurrentMonth(d) }} style={{ padding: '6px 14px', borderRadius: '7px', border: '1px solid ' + P.border, background: P.white, cursor: 'pointer', fontSize: '14px', color: P.slate }}>›</button>
                    </div>
                    <div style={{ background: P.white, borderRadius: '10px', padding: '10px', border: '1px solid ' + P.border }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '2px', marginBottom: '6px' }}>
                        {DAYS_SHORT.map(d => <div key={d} style={{ textAlign: 'center', fontSize: '9px', fontWeight: 700, color: P.muted, padding: '3px 0' }}>{d}</div>)}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '3px' }}>
                        {monthDays.map((day, i) => {
                          if (!day) return <div key={i} />
                          const dateStr = ds(day); const items = getCalForDate(dateStr)
                          const note = getNoteForDate(dateStr); const holiday = getHoliday(dateStr)
                          const isToday = dateStr === todayStr; const isSelected = dateStr === selectedDate
                          const isWeekend = day.getDay() === 0 || day.getDay() === 6
                          const completedCount = items.filter(x => x.status === 'completed').length
                          return (
                            <button key={i} onClick={() => setSelectedDate(dateStr)}
                              style={{ padding: '5px 2px', borderRadius: '6px', border: '1.5px solid', borderColor: isSelected ? P.primary : holiday ? holiday.color : isToday ? P.primaryBorder : 'transparent', background: isSelected ? P.primary : holiday ? holiday.color + '18' : isToday ? P.primaryLight : isWeekend ? P.slateLight : 'transparent', cursor: 'pointer', textAlign: 'center', minHeight: '36px' }}>
                              <div style={{ fontSize: '11px', fontWeight: isToday ? 700 : 500, color: isSelected ? '#fff' : holiday ? holiday.color : P.text }}>{day.getDate()}</div>
                              {items.length > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '1px', marginTop: '2px' }}>
                                  {items.slice(0, 3).map((_, idx) => (
                                    <div key={idx} style={{ width: '3px', height: '3px', borderRadius: '50%', background: idx < completedCount ? P.green : (isSelected ? 'rgba(255,255,255,0.5)' : P.primaryBorder) }} />
                                  ))}
                                </div>
                              )}
                              {note && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: evalCfg[note.evaluation]?.color, margin: '1px auto 0' }} />}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Seçili gün detayı */}
                <div style={{ background: P.white, borderRadius: '10px', overflow: 'hidden', border: '1px solid ' + P.border, marginBottom: '12px' }}>
                  <div style={{ padding: '11px 14px', borderBottom: '1px solid ' + P.border, background: P.slateLight }}>
                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: P.text }}>
                      {new Date(selectedDate + 'T12:00:00').toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </div>
                    {selectedHoliday && (
                      <div style={{ fontSize: '10px', fontWeight: 600, color: selectedHoliday.color, marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Icon.flag /> {selectedHoliday.name}
                      </div>
                    )}
                  </div>

                  {/* Öğretmen notu */}
                  {selectedNote && (
                    <div style={{ padding: '12px 14px', borderBottom: '1px solid ' + P.border, background: evalCfg[selectedNote.evaluation]?.bg, border: 'none', borderBottom: '1px solid ' + evalCfg[selectedNote.evaluation]?.border } as any}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.6)', color: evalCfg[selectedNote.evaluation]?.color, border: '1px solid ' + evalCfg[selectedNote.evaluation]?.border, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                          {evalCfg[selectedNote.evaluation]?.label}
                        </span>
                        <span style={{ fontSize: '10px', color: P.muted }}>{selectedNote.profiles?.full_name}</span>
                      </div>
                      <div style={{ fontSize: '12.5px', color: P.text, lineHeight: 1.7 }}>{selectedNote.note}</div>
                    </div>
                  )}

                  {selectedItems.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: P.muted, fontSize: '12px' }}>
                      {selectedHoliday ? selectedHoliday.name + ' — Çalışma yok' : 'Bu gün için çalışma planlanmamış'}
                    </div>
                  ) : selectedItems.map((item, i) => {
                    const isDone = item.status === 'completed'
                    return (
                      <div key={item.id} style={{ padding: '11px 14px', borderBottom: i < selectedItems.length - 1 ? '1px solid ' + P.border : 'none', display: 'flex', alignItems: 'center', gap: '10px', background: isDone ? '#F0FDF4' : P.white }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: isDone ? P.greenLight : P.slateLight, border: '1px solid ' + (isDone ? P.greenBorder : P.border), display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {isDone ? (
                            <span style={{ color: P.green }}><Icon.check /></span>
                          ) : (
                            <><div style={{ fontSize: '12px', fontWeight: 700, color: P.slate }}>{item.duration_minutes}</div><div style={{ fontSize: '8px', color: P.muted }}>dk</div></>
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '12.5px', fontWeight: 600, color: isDone ? P.muted : P.text, textDecoration: isDone ? 'line-through' : 'none', marginBottom: '2px' }}>{item.title}</div>
                          <div style={{ fontSize: '10px', color: P.muted }}>{item.subjects?.name}{item.topics?.name ? ' · ' + item.topics.name : ''}{item.question_count > 0 ? ' · ' + item.question_count + ' soru' : ''}</div>
                          {isDone && item.teacher_approved === null && item.is_suspicious && <div style={{ fontSize: '10px', color: P.amber, marginTop: '2px' }}>Öğretmen değerlendirmesi bekleniyor</div>}
                          {isDone && item.teacher_approved === true && <div style={{ fontSize: '10px', color: P.green, marginTop: '2px' }}>Öğretmen tarafından onaylandı</div>}
                          {isDone && item.teacher_approved === false && <div style={{ fontSize: '10px', color: P.red, marginTop: '2px' }}>Öğretmen tarafından reddedildi</div>}
                        </div>
                        <span style={{ fontSize: '10px', fontWeight: 600, padding: '3px 9px', borderRadius: '5px', background: isDone ? P.greenLight : P.slateLight, color: isDone ? P.green : P.slate, border: '1px solid ' + (isDone ? P.greenBorder : P.border), flexShrink: 0 }}>
                          {isDone ? 'Tamamlandı' : 'Bekliyor'}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Tüm öğretmen notları */}
                {calendarNotes.length > 0 && (
                  <div style={{ background: P.white, borderRadius: '10px', overflow: 'hidden', border: '1px solid ' + P.border }}>
                    <div style={{ padding: '11px 14px', borderBottom: '1px solid ' + P.border, fontSize: '12px', fontWeight: 700, color: P.text }}>
                      Tüm Öğretmen Değerlendirmeleri
                    </div>
                    {calendarNotes.slice(0, 10).map((note, i) => (
                      <div key={note.id} style={{ padding: '11px 14px', borderBottom: i < Math.min(calendarNotes.length, 10) - 1 ? '1px solid ' + P.border : 'none', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: evalCfg[note.evaluation]?.color, flexShrink: 0, marginTop: '4px' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: evalCfg[note.evaluation]?.color, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{evalCfg[note.evaluation]?.label}</span>
                            <span style={{ fontSize: '10px', color: P.muted }}>{new Date(note.calendar_date + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</span>
                          </div>
                          <div style={{ fontSize: '12px', color: P.text, lineHeight: 1.6 }}>{note.note}</div>
                          <div style={{ fontSize: '10px', color: P.muted, marginTop: '3px' }}>{note.profiles?.full_name}</div>
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
                <div style={{ fontSize: '15px', fontWeight: 700, color: P.text, marginBottom: '14px' }}>Akademik Performans</div>

                {/* Özet kart */}
                <div style={{ background: P.white, borderRadius: '12px', padding: '16px', marginBottom: '14px', border: '1px solid ' + P.border }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
                    {[
                      { label: 'Genel Başarı', value: '%' + overallRate, color: overallRate >= 70 ? P.green : overallRate >= 50 ? P.amber : P.red, bg: overallRate >= 70 ? P.greenLight : overallRate >= 50 ? P.amberLight : P.redLight },
                      { label: 'Güçlü Konu', value: String(strongTopics.length), color: P.green, bg: P.greenLight },
                      { label: 'Zayıf Konu', value: String(weakTopics.length), color: weakTopics.length > 0 ? P.red : P.green, bg: weakTopics.length > 0 ? P.redLight : P.greenLight },
                    ].map(m => (
                      <div key={m.label} style={{ background: m.bg, borderRadius: '9px', padding: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '22px', fontWeight: 700, color: m.color }}>{m.value}</div>
                        <div style={{ fontSize: '10px', color: P.muted, marginTop: '3px' }}>{m.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {topicPerf.length === 0 ? (
                  <div style={{ background: P.white, borderRadius: '10px', padding: '32px', textAlign: 'center', color: P.muted, border: '1px solid ' + P.border, fontSize: '12px' }}>Henüz performans verisi yok</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {topicPerf.map(t => {
                      const rate = Math.round(t.accuracy_rate)
                      const color = rate >= 70 ? P.green : rate >= 50 ? P.amber : P.red
                      const bg = rate >= 70 ? P.greenLight : rate >= 50 ? P.amberLight : P.redLight
                      const border = rate >= 70 ? P.greenBorder : rate >= 50 ? P.amberBorder : P.redBorder
                      return (
                        <div key={t.id} style={{ background: P.white, borderRadius: '10px', padding: '12px 14px', border: '1px solid ' + P.border }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <div>
                              <div style={{ fontSize: '12.5px', fontWeight: 600, color: P.text }}>{t.topics?.name ?? 'Genel'}</div>
                              <div style={{ fontSize: '10px', color: P.muted }}>{t.subjects?.name} · {t.total_questions} soru</div>
                            </div>
                            <span style={{ fontSize: '14px', fontWeight: 700, padding: '3px 10px', borderRadius: '6px', background: bg, color: color, border: '1px solid ' + border }}>%{rate}</span>
                          </div>
                          <div style={{ height: '5px', background: P.slateLight, borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: Math.min(t.accuracy_rate, 100) + '%', background: color, borderRadius: '3px' }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── ÖDEVLER ── */}
            {activeTab === 'homework' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: P.text }}>Ödev Durumu</div>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <span style={{ fontSize: '10px', padding: '3px 9px', borderRadius: '5px', background: P.amberLight, color: P.amber, fontWeight: 600, border: '1px solid ' + P.amberBorder }}>{pendingHw} bekliyor</span>
                    <span style={{ fontSize: '10px', padding: '3px 9px', borderRadius: '5px', background: P.greenLight, color: P.green, fontWeight: 600, border: '1px solid ' + P.greenBorder }}>{homework.filter(h => h.status === 'completed').length} tamam</span>
                  </div>
                </div>
                {homework.length === 0 ? (
                  <div style={{ background: P.white, borderRadius: '10px', padding: '32px', textAlign: 'center', color: P.muted, border: '1px solid ' + P.border, fontSize: '12px' }}>Henüz ödev atanmamış</div>
                ) : homework.map(h => {
                  const isDone = h.status === 'completed'
                  const isLate = !isDone && h.deadline && new Date(h.deadline) < new Date()
                  return (
                    <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', marginBottom: '6px', borderRadius: '10px', background: P.white, border: '1px solid', borderColor: isDone ? P.greenBorder : isLate ? P.redBorder : P.border }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: isDone ? P.greenLight : isLate ? P.redLight : P.slateLight, border: '1px solid ' + (isDone ? P.greenBorder : isLate ? P.redBorder : P.border), display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDone ? P.green : isLate ? P.red : P.slate, flexShrink: 0 }}>
                        {isDone ? <Icon.check /> : <Icon.clock />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12.5px', fontWeight: 600, color: isDone ? P.muted : P.text, textDecoration: isDone ? 'line-through' : 'none', marginBottom: '2px' }}>{h.tests?.name}</div>
                        <div style={{ fontSize: '10px', color: P.muted }}>{h.tests?.chapters?.books?.name}</div>
                        {h.deadline && <div style={{ fontSize: '10px', color: isLate ? P.red : P.muted, marginTop: '2px' }}>Son teslim: {new Date(h.deadline).toLocaleDateString('tr-TR')}</div>}
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: 600, padding: '3px 9px', borderRadius: '5px', background: isDone ? P.greenLight : isLate ? P.redLight : P.amberLight, color: isDone ? P.green : isLate ? P.red : P.amber, border: '1px solid ' + (isDone ? P.greenBorder : isLate ? P.redBorder : P.amberBorder), flexShrink: 0 }}>
                        {isDone ? 'Tamamlandı' : isLate ? 'Gecikti' : 'Bekliyor'}
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