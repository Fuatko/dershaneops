'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// ─── SVG İKONLAR ─────────────────────────────────────────────
const Icon = {
  dashboard: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  calendar: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  pencil: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  clipboard: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>,
  book: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>,
  users: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  clock: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  check: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  alert: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  plus: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  trash: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>,
  flag: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>,
  logout: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
}

// Renk paleti — kurumsal pastel
const P = {
  navy: '#1B3A6B', navyLight: '#EEF3FB',
  green: '#2E7D52', greenLight: '#EAF4EE',
  slate: '#475569', slateLight: '#F1F5F9',
  amber: '#92400E', amberLight: '#FEF3C7',
  red: '#991B1B', redLight: '#FEF2F2',
  purple: '#5B21B6', purpleLight: '#EDE9FE',
  bg: '#F8FAFC', white: '#FFFFFF',
  border: '#E2E8F0', text: '#1E293B', muted: '#94A3B8',
}

export default function TeacherPanelPage() {
  const [profile, setProfile] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [topics, setTopics] = useState<any[]>([])
  const [lessons, setLessons] = useState<any[]>([])
  const [homework, setHomework] = useState<any[]>([])
  const [books, setBooks] = useState<any[]>([])
  const [bookChapters, setBookChapters] = useState<any[]>([])
  const [suspiciousItems, setSuspiciousItems] = useState<any[]>([])
  const [holidays, setHolidays] = useState<any[]>([])
  const [selectedBook, setSelectedBook] = useState('')
  const [selectedAssignStudent, setSelectedAssignStudent] = useState('')
  const [selectedTests, setSelectedTests] = useState<string[]>([])
  const [assignDeadline, setAssignDeadline] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [assignSuccess, setAssignSuccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [calendarStudent, setCalendarStudent] = useState<any>(null)
  const [studentCalendar, setStudentCalendar] = useState<any[]>([])
  const [calendarNotes, setCalendarNotes] = useState<any[]>([])
  const [selectedCalDate, setSelectedCalDate] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  })
  const [calendarView, setCalendarView] = useState<'week' | 'month'>('week')
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getMonday(new Date()))
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [noteForm, setNoteForm] = useState({ note: '', evaluation: 'good' })
  const [savingNote, setSavingNote] = useState(false)
  const [noteSuccess, setNoteSuccess] = useState(false)
  const [newCalItem, setNewCalItem] = useState({ title: '', subject_id: '', topic_id: '', calendar_date: new Date().toISOString().slice(0, 10), duration_minutes: 45, question_count: 0 })
  const [calTopics, setCalTopics] = useState<any[]>([])
  const [savingCalItem, setSavingCalItem] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [form, setForm] = useState({ student_id: '', subject_id: '', topic_id: '', attempt_date: new Date().toISOString().slice(0, 10), correct_count: 0, wrong_count: 0, blank_count: 0, difficulty_level: 'medium', notes: '' })
  const supabase = createClient()

  function getMonday(d: Date) {
    const date = new Date(d); const day = date.getDay()
    date.setDate(date.getDate() - day + (day === 0 ? -6 : 1)); date.setHours(0,0,0,0); return date
  }

  useEffect(() => { load() }, [])
  useEffect(() => { if (form.subject_id) loadTopics(form.subject_id); else setTopics([]) }, [form.subject_id])
  useEffect(() => { if (selectedBook) loadBookChapters(selectedBook); else setBookChapters([]) }, [selectedBook])
  useEffect(() => { if (newCalItem.subject_id) loadCalTopics(newCalItem.subject_id); else setCalTopics([]) }, [newCalItem.subject_id])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    const { data: p } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()
    if (!p) { setLoading(false); return }
    setProfile(p)
    const { data: l } = await supabase.from('lessons').select('*, profiles!lessons_student_id_fkey(full_name)').eq('teacher_id', p.id).order('scheduled_at', { ascending: false })
    const { data: sub } = await supabase.from('subjects').select('*').order('name')
    const { data: bks } = await supabase.from('books').select('id, name, subject, color').order('name')
    const { data: s } = await supabase.from('profiles').select('id, full_name, grade_level, classroom_id').eq('role', 'student').order('grade_level', { ascending: true })
    const { data: classroomData } = await supabase.from('classrooms').select('id, name')
    const { data: suspicious } = await supabase.from('study_calendar').select('*, profiles!study_calendar_student_id_fkey(full_name), subjects(name)').eq('is_suspicious', true).is('teacher_approved', null).order('completed_at', { ascending: false })
    const { data: hols } = await supabase.from('public_holidays').select('*').order('holiday_date')
    const classroomMap: Record<string, string> = {}
    for (const c of classroomData ?? []) classroomMap[c.id] = c.name
    const studentsData = (s ?? []).map(st => ({ ...st, classroom_name: st.classroom_id ? classroomMap[st.classroom_id] ?? null : null }))
    const studentIds = studentsData.map((x: any) => x.id)
    let hw: any[] = []
    if (studentIds.length > 0) {
      const { data: hwData } = await supabase.from('homework_assignments').select('*, profiles!homework_assignments_student_id_fkey(full_name), tests(name, chapters(name, books(name)))').in('student_id', studentIds).order('created_at', { ascending: false })
      hw = hwData ?? []
    }
    setLessons(l ?? []); setStudents(studentsData); setSubjects(sub ?? []); setBooks(bks ?? [])
    setHomework(hw); setSuspiciousItems(suspicious ?? []); setHolidays(hols ?? [])
    setLoading(false)
  }

  async function loadTopics(subjectId: string) {
    const { data } = await supabase.from('topics').select('*').eq('subject_id', subjectId).order('order_no')
    setTopics(data ?? []); setForm(p => ({ ...p, topic_id: '' }))
  }
  async function loadCalTopics(subjectId: string) {
    const { data } = await supabase.from('topics').select('*').eq('subject_id', subjectId).order('order_no')
    setCalTopics(data ?? []); setNewCalItem(p => ({ ...p, topic_id: '' }))
  }
  async function loadBookChapters(bookId: string) {
    const { data } = await supabase.from('books').select('*, chapters(*, tests(*))').eq('id', bookId).single()
    setBookChapters(data?.chapters ?? []); setSelectedTests([])
  }
  async function loadStudentCalendar(studentId: string) {
    const [{ data: cal }, { data: notes }] = await Promise.all([
      supabase.from('study_calendar').select('*, subjects(name), topics(name)').eq('student_id', studentId).order('calendar_date'),
      supabase.from('calendar_notes').select('*').eq('student_id', studentId).order('calendar_date', { ascending: false }),
    ])
    setStudentCalendar(cal ?? []); setCalendarNotes(notes ?? [])
  }
  async function selectCalendarStudent(s: any) {
    setCalendarStudent(s); await loadStudentCalendar(s.id); setNoteSuccess(false); setShowAddForm(false)
  }
  async function approveItem(id: string, approved: boolean) {
    await supabase.from('study_calendar').update({ teacher_approved: approved }).eq('id', id)
    setSuspiciousItems(prev => prev.filter(x => x.id !== id))
    if (calendarStudent) await loadStudentCalendar(calendarStudent.id)
  }
  async function saveNote(e: React.FormEvent) {
    e.preventDefault(); if (!calendarStudent || !noteForm.note) return
    setSavingNote(true); setNoteSuccess(false)
    await supabase.from('calendar_notes').upsert({ tenant_id: '61cb6e2f-98d6-4fe7-a1c3-3afdfa7a728f', student_id: calendarStudent.id, teacher_id: profile.id, calendar_date: selectedCalDate, note: noteForm.note, evaluation: noteForm.evaluation }, { onConflict: 'student_id,teacher_id,calendar_date' })
    await loadStudentCalendar(calendarStudent.id); setNoteSuccess(true); setNoteForm({ note: '', evaluation: 'good' }); setSavingNote(false)
  }
  async function saveCalItem(e: React.FormEvent) {
    e.preventDefault(); if (!calendarStudent || !newCalItem.title) return
    setSavingCalItem(true)
    const d = new Date(newCalItem.calendar_date + 'T12:00:00')
    await supabase.from('study_calendar').insert({ tenant_id: '61cb6e2f-98d6-4fe7-a1c3-3afdfa7a728f', student_id: calendarStudent.id, subject_id: newCalItem.subject_id || null, topic_id: newCalItem.topic_id || null, calendar_date: newCalItem.calendar_date, day_of_week: d.getDay() === 0 ? 7 : d.getDay(), title: newCalItem.title, duration_minutes: newCalItem.duration_minutes, question_count: newCalItem.question_count, created_by: profile.id })
    await loadStudentCalendar(calendarStudent.id)
    setNewCalItem({ title: '', subject_id: '', topic_id: '', calendar_date: selectedCalDate, duration_minutes: 45, question_count: 0 })
    setShowAddForm(false); setSavingCalItem(false)
  }
  async function deleteCalItem(id: string) {
    if (!confirm('Bu görevi silmek istiyor musunuz?')) return
    await supabase.from('study_calendar').delete().eq('id', id)
    if (calendarStudent) await loadStudentCalendar(calendarStudent.id)
  }
  function toggleAssignTest(testId: string) {
    setSelectedTests(prev => prev.includes(testId) ? prev.filter(id => id !== testId) : [...prev, testId])
  }
  function toggleAssignChapter(chapter: any) {
    const testIds = chapter.tests?.map((t: any) => t.id) ?? []
    const allSelected = testIds.every((id: string) => selectedTests.includes(id))
    if (allSelected) setSelectedTests(prev => prev.filter(id => !testIds.includes(id)))
    else setSelectedTests(prev => [...new Set([...prev, ...testIds])])
  }
  async function handleAssign() {
    if (!selectedAssignStudent || selectedTests.length === 0) { alert('Öğrenci ve test seçin!'); return }
    setAssigning(true); setAssignSuccess(false)
    const inserts = selectedTests.map(testId => ({ student_id: selectedAssignStudent, test_id: testId, deadline: assignDeadline || null, status: 'pending', tenant_id: '61cb6e2f-98d6-4fe7-a1c3-3afdfa7a728f' }))
    const { error } = await supabase.from('homework_assignments').insert(inserts)
    if (error) { alert('Hata: ' + error.message); setAssigning(false); return }
    setAssignSuccess(true); setSelectedTests([]); setSelectedAssignStudent(''); setAssignDeadline('')
    await load(); setAssigning(false)
  }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); if (!form.student_id || !form.subject_id) { alert('Öğrenci ve ders seçin!'); return }
    setSaving(true); setSuccess(false)
    const total = form.correct_count + form.wrong_count + form.blank_count
    await supabase.from('student_question_attempts').insert({ tenant_id: '61cb6e2f-98d6-4fe7-a1c3-3afdfa7a728f', student_id: form.student_id, teacher_id: profile.id, subject_id: form.subject_id, topic_id: form.topic_id || null, attempt_date: form.attempt_date, total_questions: total, correct_count: form.correct_count, wrong_count: form.wrong_count, blank_count: form.blank_count, difficulty_level: form.difficulty_level, source_type: 'manual', notes: form.notes || null })
    const query = supabase.from('student_question_attempts').select('total_questions,correct_count,wrong_count,blank_count,attempt_date').eq('student_id', form.student_id).eq('subject_id', form.subject_id)
    const { data: attempts } = form.topic_id ? await query.eq('topic_id', form.topic_id) : await query
    if (attempts && attempts.length > 0) {
      const tQ = attempts.reduce((s, a) => s + a.total_questions, 0), tC = attempts.reduce((s, a) => s + a.correct_count, 0)
      const tW = attempts.reduce((s, a) => s + a.wrong_count, 0), tB = attempts.reduce((s, a) => s + a.blank_count, 0)
      const acc = tQ > 0 ? Math.round(tC / tQ * 100 * 100) / 100 : 0
      await supabase.from('student_topic_performance').upsert({ tenant_id: '61cb6e2f-98d6-4fe7-a1c3-3afdfa7a728f', student_id: form.student_id, subject_id: form.subject_id, topic_id: form.topic_id || null, total_questions: tQ, correct_count: tC, wrong_count: tW, blank_count: tB, accuracy_rate: acc, mastery_score: Math.round((acc * 0.70 + Math.min(attempts.length, 10) * 3.0) * 100) / 100, last_attempt_date: attempts[0].attempt_date, attempt_count: attempts.length, trend_direction: 'stable', updated_at: new Date().toISOString() }, { onConflict: 'student_id,subject_id,topic_id' })
    }
    setSuccess(true); setForm(p => ({ ...p, correct_count: 0, wrong_count: 0, blank_count: 0, notes: '', topic_id: '' }))
    await load(); setSaving(false)
  }
  async function resetHomework(id: string) {
    if (!confirm('Bu ödevi sıfırlamak istiyor musunuz?')) return
    await supabase.from('student_answers').delete().eq('assignment_id', id)
    await supabase.from('homework_assignments').update({ status: 'pending' }).eq('id', id); await load()
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
  function dstr(d: Date) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  function getCalForDate(dateStr: string) { return studentCalendar.filter(c => c.calendar_date === dateStr) }
  function getNoteForDate(dateStr: string) { return calendarNotes.find(n => n.calendar_date === dateStr) }
  function getHoliday(dateStr: string) { return holidays.find(h => h.holiday_date === dateStr) }

  const weekDays = getWeekDays(currentWeekStart)
  const monthDays = getMonthDays(currentMonth)
  const todayStr = new Date().toISOString().slice(0, 10)
  const selectedCalItems = getCalForDate(selectedCalDate)
  const selectedCalNote = getNoteForDate(selectedCalDate)
  const selectedHoliday = getHoliday(selectedCalDate)
  const DAYS_SHORT = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
  const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']

  const evalCfg: any = {
    good: { bg: P.greenLight, color: P.green, label: 'Yeterli', border: '#BBF7D0' },
    warning: { bg: P.amberLight, color: P.amber, label: 'Dikkat', border: '#FDE68A' },
    insufficient: { bg: P.redLight, color: P.red, label: 'Yetersiz', border: '#FECACA' },
  }

  const upcomingLessons = lessons.filter(l => new Date(l.scheduled_at) >= new Date() && l.status === 'scheduled').slice(0, 5)
  const total = form.correct_count + form.wrong_count + form.blank_count
  const accuracy = total > 0 ? Math.round(form.correct_count / total * 100) : 0

  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid ' + P.border, fontSize: '13px', color: P.text, outline: 'none', background: P.white, boxSizing: 'border-box', fontFamily: 'inherit' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: '11.5px', fontWeight: 600, color: P.slate, marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.3px' }

  const TABS = [
    { id: 'dashboard', label: 'Genel', Icon: Icon.dashboard },
    { id: 'calendar', label: 'Takvim', Icon: Icon.calendar },
    { id: 'questions', label: 'Soru Girişi', Icon: Icon.pencil },
    { id: 'assign', label: 'Ödev Ata', Icon: Icon.clipboard },
    { id: 'homework', label: 'Ödevler', Icon: Icon.book },
  ]

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: P.bg }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: P.navyLight, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: P.navy }}><Icon.users /></div>
        <div style={{ fontSize: '13px', color: P.muted }}>Yükleniyor...</div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: P.bg, fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", sans-serif' }}>

      {/* Header */}
      <div style={{ background: P.white, borderBottom: '1px solid ' + P.border, padding: '0 16px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: P.navy, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><rect x="1" y="1" width="7" height="7" rx="1.5" fill="white"/><rect x="10" y="1" width="7" height="7" rx="1.5" fill="white" opacity=".4"/><rect x="1" y="10" width="7" height="7" rx="1.5" fill="white" opacity=".4"/><rect x="10" y="10" width="7" height="7" rx="1.5" fill="white"/></svg>
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: P.text }}>DershaneOPS</div>
            <div style={{ fontSize: '10px', color: P.muted }}>Öğretmen Paneli</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {suspiciousItems.length > 0 && (
            <div style={{ background: P.redLight, borderRadius: '6px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid #FECACA' }}>
              <span style={{ color: P.red }}><Icon.alert /></span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: P.red }}>{suspiciousItems.length} inceleme</span>
            </div>
          )}
          <div style={{ fontSize: '12px', fontWeight: 600, color: P.slate, padding: '6px 10px', background: P.slateLight, borderRadius: '6px' }}>{profile?.full_name?.split(' ')[0]}</div>
          <button onClick={signOut} style={{ background: 'transparent', border: '1px solid ' + P.border, borderRadius: '6px', padding: '6px 8px', color: P.slate, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Icon.logout />
          </button>
        </div>
      </div>

      {/* Alt Tab Bar */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: P.white, borderTop: '1px solid ' + P.border, display: 'flex', zIndex: 100, paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flex: 1, padding: '8px 4px 10px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', position: 'relative' }}>
            <span style={{ color: activeTab === tab.id ? P.navy : P.muted }}><tab.Icon /></span>
            <span style={{ fontSize: '9px', fontWeight: activeTab === tab.id ? 700 : 500, color: activeTab === tab.id ? P.navy : P.muted }}>{tab.label}</span>
            {activeTab === tab.id && <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '24px', height: '2px', background: P.navy, borderRadius: '2px 2px 0 0' }} />}
            {tab.id === 'dashboard' && suspiciousItems.length > 0 && (
              <div style={{ position: 'absolute', top: '5px', right: '10px', width: '7px', height: '7px', borderRadius: '50%', background: P.red }} />
            )}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px 16px 80px' }}>

        {/* ── ANA SAYFA ── */}
        {activeTab === 'dashboard' && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: P.text }}>Günaydın, {profile?.full_name?.split(' ')[0]}</div>
              <div style={{ fontSize: '12px', color: P.muted, marginTop: '2px' }}>{new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '10px', marginBottom: '16px' }}>
              {[
                { label: 'Toplam Öğrenci', value: students.length, Icon: Icon.users, color: P.navy, bg: P.navyLight },
                { label: 'Yaklaşan Ders', value: upcomingLessons.length, Icon: Icon.calendar, color: P.green, bg: P.greenLight },
                { label: 'Bekleyen Ödev', value: homework.filter(h => h.status !== 'completed').length, Icon: Icon.clock, color: P.amber, bg: P.amberLight },
                { label: 'Tamamlanan Ödev', value: homework.filter(h => h.status === 'completed').length, Icon: Icon.check, color: P.green, bg: P.greenLight },
              ].map(m => (
                <div key={m.label} style={{ background: P.white, borderRadius: '12px', padding: '14px', border: '1px solid ' + P.border, display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: m.color, flexShrink: 0 }}>
                    <m.Icon />
                  </div>
                  <div>
                    <div style={{ fontSize: '22px', fontWeight: 700, color: P.text, lineHeight: 1 }}>{m.value}</div>
                    <div style={{ fontSize: '10px', color: P.muted, marginTop: '3px' }}>{m.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Şüpheli tamamlamalar */}
            {suspiciousItems.length > 0 && (
              <div style={{ background: P.white, borderRadius: '12px', overflow: 'hidden', marginBottom: '14px', border: '1px solid #FECACA' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #FEF2F2', display: 'flex', alignItems: 'center', gap: '8px', background: P.redLight }}>
                  <span style={{ color: P.red }}><Icon.alert /></span>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: P.red }}>Şüpheli Tamamlamalar — {suspiciousItems.length} adet inceleme bekliyor</div>
                </div>
                {suspiciousItems.map((item, i) => (
                  <div key={item.id} style={{ padding: '12px 16px', borderBottom: i < suspiciousItems.length - 1 ? '1px solid ' + P.border : 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12.5px', fontWeight: 600, color: P.text }}>{item.profiles?.full_name}</div>
                      <div style={{ fontSize: '11px', color: P.muted, marginTop: '2px' }}>{item.title} · {item.subjects?.name}</div>
                      {item.suspicion_reason && <div style={{ fontSize: '10px', color: P.red, marginTop: '3px' }}>{item.suspicion_reason}</div>}
                      {item.actual_duration_minutes && <div style={{ fontSize: '10px', color: P.muted, marginTop: '1px' }}>Bildirilen süre: {item.actual_duration_minutes} dk</div>}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <button onClick={() => approveItem(item.id, true)} style={{ padding: '6px 12px', borderRadius: '6px', background: P.greenLight, color: P.green, fontSize: '11px', fontWeight: 700, border: '1px solid #BBF7D0', cursor: 'pointer' }}>Onayla</button>
                      <button onClick={() => approveItem(item.id, false)} style={{ padding: '6px 12px', borderRadius: '6px', background: P.redLight, color: P.red, fontSize: '11px', fontWeight: 700, border: '1px solid #FECACA', cursor: 'pointer' }}>Reddet</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Yaklaşan dersler */}
            {upcomingLessons.length > 0 && (
              <div style={{ background: P.white, borderRadius: '12px', overflow: 'hidden', border: '1px solid ' + P.border }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid ' + P.border, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: P.navy }}><Icon.calendar /></span>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: P.text }}>Yaklaşan Dersler</div>
                </div>
                {upcomingLessons.map((l, i) => (
                  <div key={l.id} style={{ padding: '11px 16px', borderBottom: i < upcomingLessons.length - 1 ? '1px solid ' + P.border : 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: P.navyLight, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: P.navy }}>{new Date(l.scheduled_at).getDate()}</div>
                      <div style={{ fontSize: '9px', color: P.navy, opacity: 0.7 }}>{new Date(l.scheduled_at).toLocaleDateString('tr-TR', { month: 'short' })}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12.5px', fontWeight: 600, color: P.text }}>{l.subject}</div>
                      <div style={{ fontSize: '11px', color: P.muted }}>{l.profiles?.full_name}</div>
                    </div>
                    <div style={{ fontSize: '11px', color: P.muted }}>{new Date(l.scheduled_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAKVİM ── */}
        {activeTab === 'calendar' && (
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: P.text, marginBottom: '14px' }}>Çalışma Takvimi Yönetimi</div>

            <div style={{ background: P.white, borderRadius: '10px', padding: '14px', marginBottom: '14px', border: '1px solid ' + P.border }}>
              <label style={lbl}>Öğrenci</label>
              <select value={calendarStudent?.id ?? ''} onChange={e => { const s = students.find(x => x.id === e.target.value); if (s) selectCalendarStudent(s) }} style={inp}>
                <option value="">Öğrenci seçin...</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.full_name}{s.grade_level ? ' — ' + s.grade_level + '. Sınıf' : ''}{s.classroom_name ? ' (' + s.classroom_name + ')' : ''}</option>)}
              </select>
            </div>

            {!calendarStudent ? (
              <div style={{ background: P.white, borderRadius: '10px', padding: '40px', textAlign: 'center', border: '1px solid ' + P.border }}>
                <div style={{ color: P.muted, marginBottom: '8px', display: 'flex', justifyContent: 'center' }}><Icon.calendar /></div>
                <div style={{ fontSize: '13px', color: P.muted }}>Takvimi yönetmek için öğrenci seçin</div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: P.text }}>{calendarStudent.full_name}</div>
                  <div style={{ display: 'flex', gap: '2px', background: P.slateLight, borderRadius: '7px', padding: '3px' }}>
                    {(['week', 'month'] as const).map(v => (
                      <button key={v} onClick={() => setCalendarView(v)} style={{ padding: '5px 12px', borderRadius: '5px', border: 'none', background: calendarView === v ? P.white : 'transparent', color: calendarView === v ? P.navy : P.muted, fontSize: '11px', fontWeight: calendarView === v ? 700 : 500, cursor: 'pointer', boxShadow: calendarView === v ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}>
                        {v === 'week' ? 'Haftalık' : 'Aylık'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tatil Açıklama Bandı */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                  {[
                    { color: '#1B3A6B', bg: '#EEF3FB', label: 'Resmi Tatil' },
                    { color: '#2E7D52', bg: '#EAF4EE', label: 'Dini Bayram' },
                    { color: '#5B21B6', bg: '#EDE9FE', label: 'Okul Tatili' },
                  ].map(h => (
                    <div key={h.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: h.bg, border: '1.5px solid ' + h.color }} />
                      <span style={{ fontSize: '10px', color: P.muted }}>{h.label}</span>
                    </div>
                  ))}
                </div>

                {calendarView === 'week' && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <button onClick={() => { const d = new Date(currentWeekStart); d.setDate(d.getDate() - 7); setCurrentWeekStart(d) }} style={{ padding: '6px 14px', borderRadius: '7px', border: '1px solid ' + P.border, background: P.white, cursor: 'pointer', fontSize: '14px', color: P.slate }}>‹</button>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: P.text }}>{currentWeekStart.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} — {weekDays[6].toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</span>
                      <button onClick={() => { const d = new Date(currentWeekStart); d.setDate(d.getDate() + 7); setCurrentWeekStart(d) }} style={{ padding: '6px 14px', borderRadius: '7px', border: '1px solid ' + P.border, background: P.white, cursor: 'pointer', fontSize: '14px', color: P.slate }}>›</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '4px', marginBottom: '14px' }}>
                      {weekDays.map((day, i) => {
                        const dateStr = dstr(day); const items = getCalForDate(dateStr)
                        const note = getNoteForDate(dateStr); const holiday = getHoliday(dateStr)
                        const isToday = dateStr === todayStr; const isSelected = dateStr === selectedCalDate
                        const isWeekend = i >= 5
                        const completedCount = items.filter(x => x.status === 'completed').length
                        const hasSuspicious = items.some(x => x.is_suspicious && x.teacher_approved === null)
                        return (
                          <button key={i} onClick={() => { setSelectedCalDate(dateStr); setShowAddForm(false); setNoteSuccess(false) }}
                            style={{ padding: '7px 3px', borderRadius: '8px', border: '1.5px solid', borderColor: isSelected ? P.navy : holiday ? holiday.color : isToday ? '#93C5FD' : P.border, background: isSelected ? P.navy : holiday ? holiday.color + '20' : isToday ? P.navyLight : isWeekend ? P.slateLight : P.white, cursor: 'pointer', textAlign: 'center' }}>
                            <div style={{ fontSize: '8px', color: isSelected ? 'rgba(255,255,255,0.6)' : P.muted, marginBottom: '2px' }}>{DAYS_SHORT[i]}</div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: isSelected ? '#fff' : isToday ? P.navy : P.text }}>{day.getDate()}</div>
                            {holiday && !isSelected && <div style={{ width: '6px', height: '2px', borderRadius: '1px', background: holiday.color, margin: '2px auto 0' }} />}
                            {items.length > 0 && (
                              <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', marginTop: '2px' }}>
                                {items.slice(0, 3).map((_, idx) => (
                                  <div key={idx} style={{ width: '4px', height: '4px', borderRadius: '50%', background: idx < completedCount ? P.green : (isSelected ? 'rgba(255,255,255,0.5)' : '#93C5FD') }} />
                                ))}
                              </div>
                            )}
                            {hasSuspicious && <div style={{ fontSize: '8px', marginTop: '1px', color: P.red }}>!</div>}
                            {note && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: evalCfg[note.evaluation]?.color, margin: '2px auto 0' }} />}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

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
                          const dateStr = dstr(day); const items = getCalForDate(dateStr)
                          const note = getNoteForDate(dateStr); const holiday = getHoliday(dateStr)
                          const isToday = dateStr === todayStr; const isSelected = dateStr === selectedCalDate
                          const isWeekend = (day.getDay() === 0 || day.getDay() === 6)
                          const completedCount = items.filter(x => x.status === 'completed').length
                          const hasSuspicious = items.some(x => x.is_suspicious && x.teacher_approved === null)
                          return (
                            <button key={i} onClick={() => { setSelectedCalDate(dateStr); setShowAddForm(false); setNoteSuccess(false) }}
                              style={{ padding: '5px 2px', borderRadius: '6px', border: '1.5px solid', borderColor: isSelected ? P.navy : holiday ? holiday.color : isToday ? '#93C5FD' : 'transparent', background: isSelected ? P.navy : holiday ? holiday.color + '18' : isToday ? P.navyLight : isWeekend ? P.slateLight : 'transparent', cursor: 'pointer', textAlign: 'center', minHeight: '36px' }}>
                              <div style={{ fontSize: '11px', fontWeight: isToday ? 700 : 500, color: isSelected ? '#fff' : holiday ? holiday.color : P.text }}>{day.getDate()}</div>
                              {items.length > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '1px', marginTop: '2px' }}>
                                  {items.slice(0, 3).map((_, idx) => (
                                    <div key={idx} style={{ width: '3px', height: '3px', borderRadius: '50%', background: idx < completedCount ? P.green : (isSelected ? 'rgba(255,255,255,0.5)' : '#93C5FD') }} />
                                  ))}
                                </div>
                              )}
                              {hasSuspicious && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: P.red, margin: '1px auto 0' }} />}
                              {note && !hasSuspicious && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: evalCfg[note.evaluation]?.color, margin: '1px auto 0' }} />}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Seçili gün */}
                <div style={{ background: P.white, borderRadius: '10px', overflow: 'hidden', border: '1px solid ' + P.border, marginBottom: '12px' }}>
                  <div style={{ padding: '11px 14px', borderBottom: '1px solid ' + P.border, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: P.slateLight }}>
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: P.text }}>
                        {new Date(selectedCalDate + 'T12:00:00').toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </div>
                      {selectedHoliday && (
                        <div style={{ fontSize: '10px', fontWeight: 600, color: selectedHoliday.color, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Icon.flag />
                          {selectedHoliday.name}
                        </div>
                      )}
                    </div>
                    <button onClick={() => { setShowAddForm(!showAddForm); setNewCalItem(p => ({ ...p, calendar_date: selectedCalDate })) }}
                      style={{ padding: '6px 12px', borderRadius: '7px', background: showAddForm ? P.slateLight : P.navy, color: showAddForm ? P.slate : '#fff', fontSize: '11px', fontWeight: 600, border: '1px solid ' + (showAddForm ? P.border : P.navy), cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Icon.plus /> {showAddForm ? 'İptal' : 'Görev Ekle'}
                    </button>
                  </div>

                  {showAddForm && (
                    <div style={{ padding: '14px', background: P.navyLight, borderBottom: '1px solid #BFDBFE' }}>
                      <form onSubmit={saveCalItem}>
                        <div style={{ marginBottom: '10px' }}>
                          <label style={lbl}>Görev Başlığı *</label>
                          <input value={newCalItem.title} onChange={e => setNewCalItem(p => ({ ...p, title: e.target.value }))} placeholder="ör. Matematik — Türevler çalışması" style={inp} required />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                          <div>
                            <label style={lbl}>Ders</label>
                            <select value={newCalItem.subject_id} onChange={e => setNewCalItem(p => ({ ...p, subject_id: e.target.value }))} style={inp}>
                              <option value="">Seçin...</option>
                              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                          </div>
                          <div>
                            <label style={lbl}>Konu</label>
                            <select value={newCalItem.topic_id} onChange={e => setNewCalItem(p => ({ ...p, topic_id: e.target.value }))} style={inp} disabled={calTopics.length === 0}>
                              <option value="">Seçin...</option>
                              {calTopics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                          </div>
                          <div>
                            <label style={lbl}>Süre (dk)</label>
                            <input type="number" min={5} value={newCalItem.duration_minutes} onChange={e => setNewCalItem(p => ({ ...p, duration_minutes: parseInt(e.target.value) || 45 }))} style={inp} />
                          </div>
                          <div>
                            <label style={lbl}>Soru Sayısı</label>
                            <input type="number" min={0} value={newCalItem.question_count} onChange={e => setNewCalItem(p => ({ ...p, question_count: parseInt(e.target.value) || 0 }))} style={inp} />
                          </div>
                        </div>
                        <button type="submit" disabled={savingCalItem} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: P.navy, color: '#fff', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                          {savingCalItem ? 'Ekleniyor...' : 'Takvime Ekle'}
                        </button>
                      </form>
                    </div>
                  )}

                  {selectedCalItems.length === 0 && !showAddForm ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: P.muted, fontSize: '12px' }}>Bu gün için görev yok</div>
                  ) : selectedCalItems.map((item, i) => {
                    const isDone = item.status === 'completed'
                    return (
                      <div key={item.id} style={{ padding: '11px 14px', borderBottom: i < selectedCalItems.length - 1 ? '1px solid ' + P.border : 'none', display: 'flex', alignItems: 'center', gap: '10px', background: isDone ? '#F0FDF4' : P.white }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isDone ? P.green : (item.is_suspicious && item.teacher_approved === null ? P.amber : P.navy), flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '12.5px', fontWeight: 600, color: isDone ? P.muted : P.text, textDecoration: isDone ? 'line-through' : 'none' }}>{item.title}</div>
                          <div style={{ fontSize: '10px', color: P.muted, marginTop: '2px' }}>
                            {item.subjects?.name}{item.topics?.name ? ' · ' + item.topics.name : ''} · {item.duration_minutes} dk
                          </div>
                          {isDone && item.is_suspicious && item.teacher_approved === null && <div style={{ fontSize: '10px', color: P.amber, marginTop: '2px' }}>İnceleme bekliyor — {item.suspicion_reason}</div>}
                          {isDone && item.teacher_approved === true && <div style={{ fontSize: '10px', color: P.green, marginTop: '2px' }}>Onaylandı · {item.score} puan</div>}
                          {isDone && item.teacher_approved === false && <div style={{ fontSize: '10px', color: P.red, marginTop: '2px' }}>Reddedildi</div>}
                        </div>
                        {isDone && item.is_suspicious && item.teacher_approved === null ? (
                          <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                            <button onClick={() => approveItem(item.id, true)} style={{ padding: '4px 10px', borderRadius: '6px', background: P.greenLight, color: P.green, fontSize: '11px', fontWeight: 600, border: '1px solid #BBF7D0', cursor: 'pointer' }}>Onayla</button>
                            <button onClick={() => approveItem(item.id, false)} style={{ padding: '4px 10px', borderRadius: '6px', background: P.redLight, color: P.red, fontSize: '11px', fontWeight: 600, border: '1px solid #FECACA', cursor: 'pointer' }}>Reddet</button>
                          </div>
                        ) : !isDone ? (
                          <button onClick={() => deleteCalItem(item.id)} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid ' + P.border, background: P.white, color: P.muted, fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Icon.trash />
                          </button>
                        ) : null}
                      </div>
                    )
                  })}
                </div>

                {/* Not & Değerlendirme */}
                <div style={{ background: P.white, borderRadius: '10px', padding: '14px', border: '1px solid ' + P.border }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: P.text, marginBottom: '12px' }}>
                    Değerlendirme — {new Date(selectedCalDate + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                  </div>
                  {selectedCalNote && (
                    <div style={{ background: evalCfg[selectedCalNote.evaluation]?.bg, borderRadius: '8px', padding: '10px 12px', marginBottom: '12px', border: '1px solid ' + evalCfg[selectedCalNote.evaluation]?.border }}>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: evalCfg[selectedCalNote.evaluation]?.color, textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '4px' }}>{evalCfg[selectedCalNote.evaluation]?.label} — Mevcut Not</div>
                      <div style={{ fontSize: '12px', color: P.text, lineHeight: 1.6 }}>{selectedCalNote.note}</div>
                    </div>
                  )}
                  <form onSubmit={saveNote}>
                    <div style={{ marginBottom: '10px' }}>
                      <label style={lbl}>Değerlendirme</label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {[
                          { val: 'good', label: 'Yeterli' },
                          { val: 'warning', label: 'Dikkat' },
                          { val: 'insufficient', label: 'Yetersiz' },
                        ].map(ev => (
                          <button key={ev.val} type="button" onClick={() => setNoteForm(p => ({ ...p, evaluation: ev.val }))}
                            style={{ flex: 1, padding: '8px 4px', borderRadius: '7px', border: '1.5px solid', borderColor: noteForm.evaluation === ev.val ? evalCfg[ev.val].color : P.border, background: noteForm.evaluation === ev.val ? evalCfg[ev.val].bg : P.white, color: evalCfg[ev.val].color, fontSize: '11px', fontWeight: noteForm.evaluation === ev.val ? 700 : 500, cursor: 'pointer' }}>
                            {ev.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={lbl}>Not *</label>
                      <textarea value={noteForm.note} onChange={e => setNoteForm(p => ({ ...p, note: e.target.value }))} placeholder="Öğrencinin çalışması hakkında değerlendirme yazın..." rows={3} style={{ ...inp, resize: 'vertical' }} required />
                    </div>
                    {noteSuccess && <div style={{ background: P.greenLight, border: '1px solid #BBF7D0', borderRadius: '7px', padding: '9px 12px', marginBottom: '10px', fontSize: '12px', fontWeight: 600, color: P.green }}>Not başarıyla kaydedildi.</div>}
                    <button type="submit" disabled={savingNote} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: P.navy, color: '#fff', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                      {savingNote ? 'Kaydediliyor...' : selectedCalNote ? 'Notu Güncelle' : 'Not Kaydet'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── SORU GİRİŞİ ── */}
        {activeTab === 'questions' && (
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: P.text, marginBottom: '14px' }}>Soru Çözüm Girişi</div>
            <div style={{ background: P.white, borderRadius: '12px', padding: '16px', border: '1px solid ' + P.border }}>
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={lbl}>Öğrenci *</label>
                  <select value={form.student_id} onChange={e => setForm(p => ({ ...p, student_id: e.target.value }))} style={inp} required>
                    <option value="">Öğrenci seçin...</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.full_name}{s.grade_level ? ' — ' + s.grade_level + '. Sınıf' : ''}{s.classroom_name ? ' (' + s.classroom_name + ')' : ''}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                  <div>
                    <label style={lbl}>Ders *</label>
                    <select value={form.subject_id} onChange={e => setForm(p => ({ ...p, subject_id: e.target.value }))} style={inp} required>
                      <option value="">Seçin...</option>
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Konu</label>
                    <select value={form.topic_id} onChange={e => setForm(p => ({ ...p, topic_id: e.target.value }))} style={inp} disabled={topics.length === 0}>
                      <option value="">Seçin...</option>
                      {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ background: P.slateLight, borderRadius: '10px', padding: '14px', marginBottom: '12px', border: '1px solid ' + P.border }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: P.slate, textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '10px' }}>Soru Sonuçları</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '10px' }}>
                    {[
                      { label: 'Doğru', key: 'correct_count', color: P.green, bg: P.greenLight, border: '#BBF7D0' },
                      { label: 'Yanlış', key: 'wrong_count', color: P.red, bg: P.redLight, border: '#FECACA' },
                      { label: 'Boş', key: 'blank_count', color: P.slate, bg: P.slateLight, border: P.border },
                    ].map(f => (
                      <div key={f.key} style={{ background: f.bg, borderRadius: '8px', padding: '10px', textAlign: 'center', border: '1px solid ' + f.border }}>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: f.color, textTransform: 'uppercase', marginBottom: '6px' }}>{f.label}</div>
                        <input type="number" min={0} value={form[f.key as keyof typeof form] as number} onChange={e => setForm(p => ({ ...p, [f.key]: parseInt(e.target.value) || 0 }))}
                          style={{ width: '100%', padding: '4px', borderRadius: '6px', border: '1px solid ' + f.border, fontSize: '22px', fontWeight: 700, color: f.color, textAlign: 'center', background: 'rgba(255,255,255,0.7)', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: P.muted }}>Toplam: <strong style={{ color: P.text }}>{total}</strong></span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ height: '5px', width: '80px', background: P.border, borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: accuracy + '%', background: accuracy >= 70 ? P.green : accuracy >= 50 ? P.amber : P.red, borderRadius: '3px' }} />
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: accuracy >= 70 ? P.green : accuracy >= 50 ? P.amber : P.red }}>%{accuracy}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                  <div><label style={lbl}>Tarih</label><input type="date" value={form.attempt_date} onChange={e => setForm(p => ({ ...p, attempt_date: e.target.value }))} style={inp} /></div>
                  <div>
                    <label style={lbl}>Zorluk</label>
                    <select value={form.difficulty_level} onChange={e => setForm(p => ({ ...p, difficulty_level: e.target.value }))} style={inp}>
                      <option value="easy">Kolay</option>
                      <option value="medium">Orta</option>
                      <option value="hard">Zor</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: '14px' }}><label style={lbl}>Not</label><input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Gözlem veya not..." style={inp} /></div>
                {success && <div style={{ background: P.greenLight, border: '1px solid #BBF7D0', borderRadius: '7px', padding: '9px 12px', marginBottom: '12px', fontSize: '12px', fontWeight: 600, color: P.green }}>Kayıt başarıyla eklendi.</div>}
                <button type="submit" disabled={saving || total === 0} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: total > 0 ? P.navy : P.border, color: '#fff', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                  {saving ? 'Kaydediliyor...' : 'Kaydet ve Skoru Güncelle'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── ÖDEV ATA ── */}
        {activeTab === 'assign' && (
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: P.text, marginBottom: '14px' }}>Ödev Ata</div>
            <div style={{ background: P.white, borderRadius: '12px', padding: '16px', marginBottom: '12px', border: '1px solid ' + P.border }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={lbl}>Öğrenci *</label>
                  <select value={selectedAssignStudent} onChange={e => setSelectedAssignStudent(e.target.value)} style={inp}>
                    <option value="">Seçin...</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.full_name}{s.grade_level ? ' — ' + s.grade_level + '. Sınıf' : ''}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Son Teslim</label>
                  <input type="date" value={assignDeadline} onChange={e => setAssignDeadline(e.target.value)} style={inp} />
                </div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={lbl}>Kitap</label>
                <select value={selectedBook} onChange={e => setSelectedBook(e.target.value)} style={inp}>
                  <option value="">Kitap seçin...</option>
                  {books.map(b => <option key={b.id} value={b.id}>{b.name} — {b.subject}</option>)}
                </select>
              </div>
              {selectedTests.length > 0 && (
                <div style={{ padding: '9px 12px', background: P.navyLight, borderRadius: '8px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #BFDBFE' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: P.navy }}>{selectedTests.length} test seçildi</span>
                  {assignSuccess && <span style={{ fontSize: '11px', color: P.green, fontWeight: 600 }}>Başarıyla atandı</span>}
                </div>
              )}
              <button onClick={handleAssign} disabled={assigning || selectedTests.length === 0 || !selectedAssignStudent}
                style={{ width: '100%', padding: '11px', borderRadius: '8px', background: selectedTests.length > 0 && selectedAssignStudent ? P.navy : P.border, color: '#fff', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                {assigning ? 'Atanıyor...' : 'Ödev Ata'}
              </button>
            </div>
            {bookChapters.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {bookChapters.map(chapter => {
                  const testIds = chapter.tests?.map((t: any) => t.id) ?? []
                  const allSelected = testIds.length > 0 && testIds.every((id: string) => selectedTests.includes(id))
                  return (
                    <div key={chapter.id} style={{ background: P.white, borderRadius: '10px', overflow: 'hidden', border: '1px solid ' + P.border }}>
                      <div onClick={() => toggleAssignChapter(chapter)} style={{ padding: '11px 14px', background: P.slateLight, borderBottom: '1px solid ' + P.border, display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                        <div style={{ width: '18px', height: '18px', borderRadius: '4px', border: '1.5px solid', borderColor: allSelected ? P.navy : P.border, background: allSelected ? P.navy : P.white, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {allSelected && <span style={{ color: '#fff' }}><Icon.check /></span>}
                        </div>
                        <span style={{ fontSize: '12.5px', fontWeight: 600, color: P.text, flex: 1 }}>{chapter.name}</span>
                        <span style={{ fontSize: '10px', color: P.muted }}>{chapter.tests?.length ?? 0} test</span>
                      </div>
                      {(chapter.tests ?? []).map((test: any, i: number) => {
                        const isSelected = selectedTests.includes(test.id)
                        return (
                          <div key={test.id} onClick={() => toggleAssignTest(test.id)} style={{ padding: '10px 14px', borderBottom: i < chapter.tests.length - 1 ? '1px solid ' + P.border : 'none', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', background: isSelected ? P.navyLight : P.white }}>
                            <div style={{ width: '16px', height: '16px', borderRadius: '3px', border: '1.5px solid', borderColor: isSelected ? P.navy : P.border, background: isSelected ? P.navy : P.white, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {isSelected && <span style={{ color: '#fff' }}><Icon.check /></span>}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '12px', fontWeight: 500, color: P.text }}>{test.name}</div>
                              <div style={{ fontSize: '10px', color: P.muted }}>{test.question_count} soru</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── ÖDEV TAKİBİ ── */}
        {activeTab === 'homework' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: P.text }}>Ödev Takibi</div>
              <div style={{ display: 'flex', gap: '5px' }}>
                <span style={{ fontSize: '10px', padding: '3px 9px', borderRadius: '6px', background: P.amberLight, color: P.amber, fontWeight: 600, border: '1px solid #FDE68A' }}>{homework.filter(h => h.status !== 'completed').length} bekliyor</span>
                <span style={{ fontSize: '10px', padding: '3px 9px', borderRadius: '6px', background: P.greenLight, color: P.green, fontWeight: 600, border: '1px solid #BBF7D0' }}>{homework.filter(h => h.status === 'completed').length} tamam</span>
              </div>
            </div>
            {homework.length === 0 ? (
              <div style={{ background: P.white, borderRadius: '10px', padding: '32px', textAlign: 'center', color: P.muted, border: '1px solid ' + P.border, fontSize: '13px' }}>Henüz ödev atanmamış</div>
            ) : homework.map((h, i) => {
              const isDone = h.status === 'completed'
              const isLate = !isDone && h.deadline && new Date(h.deadline) < new Date()
              const student = students.find(s => s.id === h.student_id)
              return (
                <div key={h.id} style={{ padding: '12px 14px', marginBottom: '6px', borderRadius: '10px', background: P.white, border: '1px solid', borderColor: isDone ? '#BBF7D0' : isLate ? '#FECACA' : P.border, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: isDone ? P.greenLight : P.navyLight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDone ? P.green : P.navy, flexShrink: 0 }}>
                    {isDone ? <Icon.check /> : <Icon.clock />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12.5px', fontWeight: 600, color: P.text, marginBottom: '2px' }}>{h.tests?.name}</div>
                    <div style={{ fontSize: '10px', color: P.muted }}>{h.profiles?.full_name}{student?.grade_level ? ' · ' + student.grade_level + '. Sınıf' : ''}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                    <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '5px', background: isDone ? P.greenLight : isLate ? P.redLight : P.amberLight, color: isDone ? P.green : isLate ? P.red : P.amber, border: '1px solid ' + (isDone ? '#BBF7D0' : isLate ? '#FECACA' : '#FDE68A') }}>
                      {isDone ? 'Tamamlandı' : isLate ? 'Gecikti' : 'Bekliyor'}
                    </span>
                    {isDone && (
                      <button onClick={() => resetHomework(h.id)} style={{ padding: '2px 8px', borderRadius: '5px', border: '1px solid ' + P.border, background: P.white, color: P.muted, fontSize: '10px', cursor: 'pointer' }}>Sıfırla</button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}