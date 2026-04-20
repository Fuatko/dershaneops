'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function StudentPanelPage() {
  const [profile, setProfile] = useState<any>(null)
  const [topicPerf, setTopicPerf] = useState<any[]>([])
  const [homework, setHomework] = useState<any[]>([])
  const [studyPlan, setStudyPlan] = useState<any>(null)
  const [riskScore, setRiskScore] = useState(0)
  const [streak, setStreak] = useState<any>(null)
  const [badges, setBadges] = useState<any[]>([])
  const [dailyTasks, setDailyTasks] = useState<any[]>([])
  const [goals, setGoals] = useState<any[]>([])
  const [calendar, setCalendar] = useState<any[]>([])
  const [calendarNotes, setCalendarNotes] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10))
  const [calendarView, setCalendarView] = useState<'week' | 'month'>('week')
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getMonday(new Date()))
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('today')
  const [celebration, setCelebration] = useState(false)
  const [celebrationMsg, setCelebrationMsg] = useState('')
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

    const [{ data: tp }, { data: hw }, { data: sp }, { data: risk }, { data: st },
           { data: sb }, { data: dt }, { data: g }, { data: cal }, { data: notes }] = await Promise.all([
      supabase.from('student_topic_performance').select('*, topics(name), subjects(name, color)').eq('student_id', p.id).order('accuracy_rate', { ascending: true }),
      supabase.from('homework_assignments').select('*, tests(name, chapters(name, books(name)))').eq('student_id', p.id).order('created_at', { ascending: false }),
      supabase.from('study_plans').select('*, study_plan_items(*, subjects(name), topics(name))').eq('student_id', p.id).eq('status', 'active').order('created_at', { ascending: false }).limit(1).single(),
      supabase.rpc('calculate_risk_score', { p_student_id: p.id }),
      supabase.from('student_streaks').select('*').eq('student_id', p.id).single(),
      supabase.from('student_badges').select('*, badges(*)').eq('student_id', p.id),
      supabase.from('daily_tasks').select('*, subjects(name, color), topics(name)').eq('student_id', p.id).eq('task_date', new Date().toISOString().slice(0, 10)).order('status'),
      supabase.from('student_goals').select('*').eq('student_id', p.id).eq('status', 'active'),
      supabase.from('study_calendar').select('*, subjects(name, color), topics(name)').eq('student_id', p.id).order('calendar_date'),
      supabase.from('calendar_notes').select('*, profiles!calendar_notes_teacher_id_fkey(full_name)').eq('student_id', p.id).order('calendar_date', { ascending: false }),
    ])

    setTopicPerf(tp ?? [])
    setHomework(hw ?? [])
    setStudyPlan(sp)
    setRiskScore(risk ?? 0)
    setStreak(st)
    setBadges(sb ?? [])
    setDailyTasks(dt ?? [])
    setGoals(g ?? [])
    setCalendar(cal ?? [])
    setCalendarNotes(notes ?? [])
    setLoading(false)
  }

  async function completeCalendarItem(id: string) {
    const score = Math.floor(Math.random() * 20) + 80
    await supabase.from('study_calendar').update({ status: 'completed', completed_at: new Date().toISOString(), score }).eq('id', id)
    setCelebrationMsg('Tamamlandı! ' + score + ' puan! ⭐')
    setCelebration(true)
    setTimeout(() => setCelebration(false), 2500)
    await load()
  }

  async function completeTask(taskId: string) {
    const task = dailyTasks.find(t => t.id === taskId)
    if (!task) return
    const score = Math.floor(Math.random() * 20) + 80
    await supabase.from('daily_tasks').update({ status: 'completed', completed_at: new Date().toISOString(), score }).eq('id', taskId)
    const today = new Date().toISOString().slice(0, 10)
    if (streak) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
      const newStreak = streak.last_active_date === today ? streak.current_streak : (streak.last_active_date === yesterday ? streak.current_streak + 1 : 1)
      await supabase.from('student_streaks').update({ current_streak: newStreak, longest_streak: Math.max(newStreak, streak.longest_streak ?? 0), last_active_date: today, total_points: (streak.total_points ?? 0) + score, daily_score: Math.min((streak.daily_score ?? 0) + score, 100), updated_at: new Date().toISOString() }).eq('student_id', profile.id)
    }
    const remaining = dailyTasks.filter(t => t.status === 'pending' && t.id !== taskId).length
    if (remaining === 0) { setCelebrationMsg('Tüm görevleri tamamladın! 🎉'); setCelebration(true); setTimeout(() => setCelebration(false), 4000) }
    else if (score >= 95) { setCelebrationMsg('Mükemmel! ' + score + ' puan! ⭐'); setCelebration(true); setTimeout(() => setCelebration(false), 2500) }
    await load()
  }

  async function signOut() { await supabase.auth.signOut(); window.location.href = '/login' }

  // Takvim yardımcı fonksiyonlar
  function getWeekDays(startDate: Date) {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startDate)
      d.setDate(startDate.getDate() + i)
      return d
    })
  }

  function getMonthDays(date: Date) {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startPad = (firstDay.getDay() + 6) % 7
    const days: (Date | null)[] = []
    for (let i = 0; i < startPad; i++) days.push(null)
    for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i))
    return days
  }

  function getCalendarForDate(dateStr: string) {
    return calendar.filter(c => c.calendar_date === dateStr)
  }

  function getNoteForDate(dateStr: string) {
    return calendarNotes.find(n => n.calendar_date === dateStr)
  }

  function dateStr(d: Date) {
    return d.toISOString().slice(0, 10)
  }

  const weekDays = getWeekDays(currentWeekStart)
  const monthDays = getMonthDays(currentMonth)
  const todayStr = new Date().toISOString().slice(0, 10)
  const selectedItems = getCalendarForDate(selectedDate)
  const selectedNote = getNoteForDate(selectedDate)

  const totalQ = topicPerf.reduce((s, t) => s + t.total_questions, 0)
  const totalC = topicPerf.reduce((s, t) => s + t.correct_count, 0)
  const overallRate = totalQ > 0 ? Math.round(totalC / totalQ * 100) : 0
  const pendingHw = homework.filter(h => h.status !== 'completed').length
  const completedTasks = dailyTasks.filter(t => t.status === 'completed').length
  const totalTasks = dailyTasks.length
  const dailyProgress = totalTasks > 0 ? Math.round(completedTasks / totalTasks * 100) : 0
  const weakTopics = topicPerf.filter(t => t.accuracy_rate < 50)
  const strongTopics = topicPerf.filter(t => t.accuracy_rate >= 70)
  const midTopics = topicPerf.filter(t => t.accuracy_rate >= 50 && t.accuracy_rate < 70)
  const dailyScore = streak?.daily_score ?? 0
  const DAYS_SHORT = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
  const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']

  function getDailyScoreFeedback(score: number) {
    if (score >= 96) return { msg: 'Muhteşem! Sen bir yıldızsın!', color: '#B45309', bg: '#FDF4E7', emoji: '🌟' }
    if (score >= 76) return { msg: 'Harika gidiyorsun!', color: '#2E7D52', bg: '#EAF4EE', emoji: '⭐' }
    if (score >= 50) return { msg: 'İyi iş, devam et!', color: '#1B3A6B', bg: '#EEF3FB', emoji: '💪' }
    return { msg: 'Bugün daha fazlasını yapabilirsin!', color: '#7A8FA8', bg: '#F0F4F9', emoji: '🎯' }
  }
  const fb = getDailyScoreFeedback(dailyScore)

  const evalStyle: any = {
    good: { bg: '#EAF4EE', color: '#2E7D52', label: '✓ Yeterli', icon: '✓' },
    warning: { bg: '#FDF4E7', color: '#B45309', label: '⚠ Dikkat', icon: '⚠' },
    insufficient: { bg: '#FEF2F2', color: '#C0392B', label: '✗ Yetersiz', icon: '✗' },
  }

  const TABS = [
    { id: 'today', label: 'Bugün', icon: '📅' },
    { id: 'calendar', label: 'Takvim', icon: '🗓' },
    { id: 'performance', label: 'Performans', icon: '📊' },
    { id: 'homework', label: 'Ödevler', icon: '📚' },
    { id: 'goals', label: 'Hedefler', icon: '🎯' },
    { id: 'swot', label: 'SWOT', icon: '🔍' },
  ]

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#F0F4F9' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>📚</div>
        <div style={{ fontSize: '14px', color: '#7A8FA8' }}>Yükleniyor...</div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F0F4F9', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>

      {celebration && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, pointerEvents: 'none', background: 'rgba(0,0,0,0.3)' }}>
          <div style={{ background: '#1B3A6B', borderRadius: '20px', padding: '28px 40px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
            <div style={{ fontSize: '52px', marginBottom: '10px' }}>🎉</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#fff' }}>{celebrationMsg}</div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ background: '#1B3A6B', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 800, color: '#fff' }}>D</div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>DershaneOPS</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>{profile?.full_name?.split(' ')[0]}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {streak && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.1)', padding: '5px 10px', borderRadius: '20px' }}>
              <span style={{ fontSize: '14px' }}>🔥</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>{streak.current_streak}</span>
            </div>
          )}
          <button onClick={signOut} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', padding: '6px 10px', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>Çıkış</button>
        </div>
      </div>

      {/* Günlük skor bar */}
      {streak && (
        <div style={{ background: '#fff', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #F0F4F9' }}>
          <div style={{ flex: 1, height: '6px', background: '#F0F4F9', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: dailyScore + '%', background: dailyScore >= 75 ? '#2E7D52' : dailyScore >= 50 ? '#B45309' : '#1B3A6B', borderRadius: '3px', transition: 'width 0.5s' }} />
          </div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#1B3A6B', flexShrink: 0 }}>{dailyScore}/100</span>
          <span style={{ fontSize: '13px' }}>{fb.emoji}</span>
        </div>
      )}

      {/* Alt Tab Bar */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #E2EAF8', display: 'flex', zIndex: 100, paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flex: 1, padding: '8px 4px 10px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
            <span style={{ fontSize: '18px' }}>{tab.icon}</span>
            <span style={{ fontSize: '9px', fontWeight: activeTab === tab.id ? 700 : 500, color: activeTab === tab.id ? '#1B3A6B' : '#9CA3AF' }}>{tab.label}</span>
            {activeTab === tab.id && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#1B3A6B' }} />}
          </button>
        ))}
      </div>

      {/* İçerik */}
      <div style={{ padding: '16px 16px 80px' }}>

        {/* BUGÜN */}
        {activeTab === 'today' && (
          <div>
            <div style={{ background: 'linear-gradient(135deg, #1B3A6B 0%, #2563EB 100%)', borderRadius: '16px', padding: '18px', marginBottom: '14px', color: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 800, marginBottom: '4px' }}>Merhaba, {profile?.full_name?.split(' ')[0]}! 👋</div>
                  <div style={{ fontSize: '12px', opacity: 0.7 }}>{new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                </div>
                <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '8px 14px' }}>
                  <div style={{ fontSize: '28px', fontWeight: 800 }}>{dailyProgress}%</div>
                  <div style={{ fontSize: '10px', opacity: 0.7 }}>Bugün</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '14px' }}>
              {[
                { label: 'Seri', value: (streak?.current_streak ?? 0) + ' gün', icon: '🔥', color: '#B45309', bg: '#FDF4E7' },
                { label: 'Puan', value: streak?.total_points ?? 0, icon: '💎', color: '#6B4FC8', bg: '#F0ECFB' },
                { label: 'Rozet', value: badges.length, icon: '🏅', color: '#2E7D52', bg: '#EAF4EE' },
              ].map(m => (
                <div key={m.label} style={{ background: m.bg, borderRadius: '14px', padding: '14px 10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '22px', marginBottom: '4px' }}>{m.icon}</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: m.color }}>{m.value}</div>
                  <div style={{ fontSize: '10px', color: '#7A8FA8' }}>{m.label}</div>
                </div>
              ))}
            </div>

            {streak && (
              <div style={{ background: fb.bg, borderRadius: '12px', padding: '12px 14px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>{fb.emoji}</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: fb.color }}>{fb.msg}</div>
                  <div style={{ fontSize: '11px', color: '#7A8FA8' }}>Günlük skor: {dailyScore}/100</div>
                </div>
              </div>
            )}

            {/* Bugünün takvim görevleri */}
            {getCalendarForDate(todayStr).length > 0 && (
              <div style={{ background: '#fff', borderRadius: '14px', overflow: 'hidden', marginBottom: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #F0F4F9', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>🗓</span>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>Bugünün Çalışma Takvimi</div>
                </div>
                {getCalendarForDate(todayStr).map((item, i) => {
                  const isDone = item.status === 'completed'
                  return (
                    <div key={item.id} style={{ padding: '12px 16px', borderBottom: i < getCalendarForDate(todayStr).length - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', alignItems: 'center', gap: '12px', background: isDone ? '#F8FFF8' : '#fff' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: isDone ? '#EAF4EE' : '#EEF3FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: isDone ? '#2E7D52' : '#1B3A6B', flexShrink: 0 }}>
                        {isDone ? '✓' : item.duration_minutes + 'dk'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: isDone ? '#7A8FA8' : '#1B3A6B', textDecoration: isDone ? 'line-through' : 'none' }}>{item.title}</div>
                        <div style={{ fontSize: '11px', color: '#7A8FA8' }}>{item.subjects?.name}{item.topics?.name ? ' — ' + item.topics.name : ''}</div>
                      </div>
                      {isDone ? (
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '16px', fontWeight: 800, color: '#2E7D52' }}>{item.score}</div>
                          <div style={{ fontSize: '9px', color: '#7A8FA8' }}>puan</div>
                        </div>
                      ) : (
                        <button onClick={() => completeCalendarItem(item.id)} style={{ padding: '7px 12px', borderRadius: '20px', background: '#1B3A6B', color: '#fff', fontSize: '12px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                          Yaptım!
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Günlük görevler */}
            <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', marginBottom: '14px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #F0F4F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#1B3A6B' }}>📋 Günlük Görevler</div>
                <span style={{ fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: completedTasks === totalTasks && totalTasks > 0 ? '#EAF4EE' : '#EEF3FB', color: completedTasks === totalTasks && totalTasks > 0 ? '#2E7D52' : '#1B3A6B' }}>
                  {completedTasks}/{totalTasks}
                </span>
              </div>
              {dailyTasks.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎉</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#2E7D52' }}>Bugün için görev yok!</div>
                </div>
              ) : dailyTasks.map((task, i) => {
                const isDone = task.status === 'completed'
                return (
                  <div key={task.id} style={{ padding: '14px 16px', borderBottom: i < dailyTasks.length - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', alignItems: 'center', gap: '12px', background: isDone ? '#F8FFF8' : '#fff' }}>
                    <button onClick={() => !isDone && completeTask(task.id)} style={{ width: '44px', height: '44px', borderRadius: '50%', background: isDone ? '#2E7D52' : '#EEF3FB', border: isDone ? 'none' : '2px solid #D5DFF0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isDone ? 'default' : 'pointer', flexShrink: 0, fontSize: '18px' }}>
                      {isDone ? '✓' : '📖'}
                    </button>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: isDone ? '#7A8FA8' : '#1B3A6B', textDecoration: isDone ? 'line-through' : 'none', marginBottom: '2px' }}>
                        {task.subjects?.name ?? 'Genel'}{task.topics?.name ? ' — ' + task.topics.name : ''}
                      </div>
                      <div style={{ fontSize: '11px', color: '#7A8FA8' }}>{task.target_duration_minutes} dk</div>
                    </div>
                    {isDone ? (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#2E7D52' }}>{task.score}</div>
                        <div style={{ fontSize: '9px', color: '#7A8FA8' }}>puan</div>
                      </div>
                    ) : (
                      <button onClick={() => completeTask(task.id)} style={{ padding: '8px 14px', borderRadius: '20px', background: '#1B3A6B', color: '#fff', fontSize: '12px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                        Yaptım!
                      </button>
                    )}
                  </div>
                )
              })}
            </div>

            {pendingHw > 0 && (
              <div onClick={() => setActiveTab('homework')} style={{ background: '#FDF4E7', borderRadius: '12px', padding: '14px 16px', border: '1px solid #FED7AA', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '22px' }}>📝</span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#B45309' }}>{pendingHw} bekleyen ödev var</div>
                    <div style={{ fontSize: '11px', color: '#7A8FA8' }}>Görmek için tıkla</div>
                  </div>
                </div>
                <span style={{ fontSize: '18px', color: '#B45309' }}>→</span>
              </div>
            )}
          </div>
        )}

        {/* TAKVİM */}
        {activeTab === 'calendar' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#1B3A6B' }}>🗓 Çalışma Takvimim</div>
              <div style={{ display: 'flex', gap: '4px', background: '#F0F4F9', borderRadius: '8px', padding: '3px' }}>
                {(['week', 'month'] as const).map(v => (
                  <button key={v} onClick={() => setCalendarView(v)} style={{ padding: '5px 12px', borderRadius: '6px', border: 'none', background: calendarView === v ? '#fff' : 'transparent', color: calendarView === v ? '#1B3A6B' : '#9CA3AF', fontSize: '12px', fontWeight: calendarView === v ? 700 : 500, cursor: 'pointer' }}>
                    {v === 'week' ? 'Hafta' : 'Ay'}
                  </button>
                ))}
              </div>
            </div>

            {/* Haftalık Görünüm */}
            {calendarView === 'week' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <button onClick={() => { const d = new Date(currentWeekStart); d.setDate(d.getDate() - 7); setCurrentWeekStart(d) }} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #D5DFF0', background: '#fff', cursor: 'pointer', fontSize: '16px' }}>‹</button>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>
                    {currentWeekStart.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} — {weekDays[6].toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                  </span>
                  <button onClick={() => { const d = new Date(currentWeekStart); d.setDate(d.getDate() + 7); setCurrentWeekStart(d) }} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #D5DFF0', background: '#fff', cursor: 'pointer', fontSize: '16px' }}>›</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '4px', marginBottom: '14px' }}>
                  {weekDays.map((day, i) => {
                    const ds = dateStr(day)
                    const items = getCalendarForDate(ds)
                    const note = getNoteForDate(ds)
                    const isToday = ds === todayStr
                    const isSelected = ds === selectedDate
                    const completedCount = items.filter(x => x.status === 'completed').length
                    return (
                      <button key={i} onClick={() => setSelectedDate(ds)} style={{ padding: '8px 4px', borderRadius: '10px', border: '2px solid', borderColor: isSelected ? '#1B3A6B' : isToday ? '#93C5FD' : '#E2EAF8', background: isSelected ? '#1B3A6B' : isToday ? '#EEF3FB' : '#fff', cursor: 'pointer', textAlign: 'center' }}>
                        <div style={{ fontSize: '9px', color: isSelected ? 'rgba(255,255,255,0.7)' : '#9CA3AF', marginBottom: '2px' }}>{DAYS_SHORT[i]}</div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: isSelected ? '#fff' : isToday ? '#1B3A6B' : '#374151' }}>{day.getDate()}</div>
                        {items.length > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', marginTop: '4px' }}>
                            {items.slice(0, 3).map((_, idx) => (
                              <div key={idx} style={{ width: '5px', height: '5px', borderRadius: '50%', background: idx < completedCount ? '#2E7D52' : (isSelected ? 'rgba(255,255,255,0.5)' : '#93C5FD') }} />
                            ))}
                          </div>
                        )}
                        {note && (
                          <div style={{ marginTop: '3px', fontSize: '10px' }}>
                            {note.evaluation === 'good' ? '✓' : note.evaluation === 'warning' ? '⚠' : '✗'}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Seçili gün detayı */}
                <div style={{ background: '#fff', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
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

                  {selectedNote?.note && (
                    <div style={{ padding: '12px 16px', background: '#EEF3FB', borderBottom: '1px solid #F0F4F9', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '16px' }}>👨‍🏫</span>
                      <div>
                        <div style={{ fontSize: '10px', color: '#7A8FA8', marginBottom: '3px' }}>Öğretmen Notu — {selectedNote.profiles?.full_name}</div>
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
                          {isDone ? (
                            <div style={{ fontSize: '18px', color: '#2E7D52' }}>✓</div>
                          ) : (
                            <>
                              <div style={{ fontSize: '12px', fontWeight: 800, color: '#1B3A6B' }}>{item.duration_minutes}</div>
                              <div style={{ fontSize: '8px', color: '#7A8FA8' }}>dk</div>
                            </>
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: isDone ? '#7A8FA8' : '#1B3A6B', textDecoration: isDone ? 'line-through' : 'none', marginBottom: '2px' }}>{item.title}</div>
                          <div style={{ fontSize: '11px', color: '#7A8FA8' }}>
                            {item.subjects?.name}{item.topics?.name ? ' — ' + item.topics.name : ''}
                            {item.question_count > 0 ? ' · ' + item.question_count + ' soru' : ''}
                          </div>
                        </div>
                        {isDone ? (
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '18px', fontWeight: 800, color: '#2E7D52' }}>{item.score}</div>
                            <div style={{ fontSize: '9px', color: '#7A8FA8' }}>puan</div>
                          </div>
                        ) : selectedDate === todayStr ? (
                          <button onClick={() => completeCalendarItem(item.id)} style={{ padding: '8px 12px', borderRadius: '20px', background: '#1B3A6B', color: '#fff', fontSize: '12px', fontWeight: 700, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                            Yaptım!
                          </button>
                        ) : (
                          <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '20px', background: '#F0F4F9', color: '#7A8FA8' }}>Bekliyor</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Aylık Görünüm */}
            {calendarView === 'month' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <button onClick={() => { const d = new Date(currentMonth); d.setMonth(d.getMonth() - 1); setCurrentMonth(d) }} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #D5DFF0', background: '#fff', cursor: 'pointer', fontSize: '16px' }}>‹</button>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#1B3A6B' }}>{MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
                  <button onClick={() => { const d = new Date(currentMonth); d.setMonth(d.getMonth() + 1); setCurrentMonth(d) }} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #D5DFF0', background: '#fff', cursor: 'pointer', fontSize: '16px' }}>›</button>
                </div>

                <div style={{ background: '#fff', borderRadius: '14px', padding: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '2px', marginBottom: '8px' }}>
                    {DAYS_SHORT.map(d => (
                      <div key={d} style={{ textAlign: 'center', fontSize: '10px', fontWeight: 700, color: '#9CA3AF', padding: '4px 0' }}>{d}</div>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '3px' }}>
                    {monthDays.map((day, i) => {
                      if (!day) return <div key={i} />
                      const ds = dateStr(day)
                      const items = getCalendarForDate(ds)
                      const note = getNoteForDate(ds)
                      const isToday = ds === todayStr
                      const isSelected = ds === selectedDate
                      const completedCount = items.filter(x => x.status === 'completed').length
                      return (
                        <button key={i} onClick={() => setSelectedDate(ds)} style={{ padding: '6px 2px', borderRadius: '8px', border: '2px solid', borderColor: isSelected ? '#1B3A6B' : isToday ? '#93C5FD' : 'transparent', background: isSelected ? '#1B3A6B' : isToday ? '#EEF3FB' : 'transparent', cursor: 'pointer', textAlign: 'center' }}>
                          <div style={{ fontSize: '12px', fontWeight: isToday ? 800 : 500, color: isSelected ? '#fff' : isToday ? '#1B3A6B' : '#374151' }}>{day.getDate()}</div>
                          {items.length > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '1px', marginTop: '2px' }}>
                              {items.slice(0, 3).map((_, idx) => (
                                <div key={idx} style={{ width: '4px', height: '4px', borderRadius: '50%', background: idx < completedCount ? '#2E7D52' : (isSelected ? 'rgba(255,255,255,0.6)' : '#93C5FD') }} />
                              ))}
                            </div>
                          )}
                          {note && (
                            <div style={{ fontSize: '9px', marginTop: '1px' }}>
                              {note.evaluation === 'good' ? '✓' : note.evaluation === 'warning' ? '⚠' : '✗'}
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Seçili gün detayı */}
                {selectedDate && (
                  <div style={{ background: '#fff', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
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
                    {selectedNote?.note && (
                      <div style={{ padding: '12px 16px', background: '#EEF3FB', borderBottom: '1px solid #F0F4F9', display: 'flex', gap: '10px' }}>
                        <span style={{ fontSize: '16px' }}>👨‍🏫</span>
                        <div>
                          <div style={{ fontSize: '10px', color: '#7A8FA8', marginBottom: '3px' }}>Öğretmen Notu</div>
                          <div style={{ fontSize: '12.5px', color: '#1B3A6B', lineHeight: 1.6 }}>{selectedNote.note}</div>
                        </div>
                      </div>
                    )}
                    {selectedItems.length === 0 ? (
                      <div style={{ padding: '24px', textAlign: 'center', color: '#7A8FA8', fontSize: '13px' }}>Bu gün için çalışma yok</div>
                    ) : selectedItems.map((item, i) => {
                      const isDone = item.status === 'completed'
                      return (
                        <div key={item.id} style={{ padding: '12px 16px', borderBottom: i < selectedItems.length - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isDone ? '#2E7D52' : '#1B3A6B', flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: isDone ? '#7A8FA8' : '#1B3A6B', textDecoration: isDone ? 'line-through' : 'none' }}>{item.title}</div>
                            <div style={{ fontSize: '11px', color: '#7A8FA8' }}>{item.subjects?.name} · {item.duration_minutes} dk</div>
                          </div>
                          {isDone && <span style={{ fontSize: '11px', fontWeight: 700, color: '#2E7D52' }}>✓ {item.score} puan</span>}
                          {!isDone && selectedDate === todayStr && (
                            <button onClick={() => completeCalendarItem(item.id)} style={{ padding: '6px 12px', borderRadius: '16px', background: '#1B3A6B', color: '#fff', fontSize: '11px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>Yaptım!</button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* PERFORMANS */}
        {activeTab === 'performance' && (
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#1B3A6B', marginBottom: '14px' }}>📊 Konu Performansım</div>
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

        {/* ÖDEVLER */}
        {activeTab === 'homework' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#1B3A6B' }}>📚 Ödevlerim</div>
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
                <a key={h.id} href={`/homework/${h.id}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '13px', marginBottom: '8px', borderRadius: '14px', textDecoration: 'none', background: '#fff', border: '1px solid', borderColor: isDone ? '#D1FAE5' : isLate ? '#FECACA' : '#E2EAF8' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: isDone ? '#EAF4EE' : isLate ? '#FEF2F2' : '#EEF3FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                    {isDone ? '✅' : isLate ? '⏰' : '📝'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', textDecoration: isDone ? 'line-through' : 'none' }}>{h.tests?.name}</div>
                    <div style={{ fontSize: '11px', color: '#7A8FA8' }}>{h.tests?.chapters?.books?.name}</div>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', background: isDone ? '#EAF4EE' : isLate ? '#FEF2F2' : '#FDF4E7', color: isDone ? '#2E7D52' : isLate ? '#C0392B' : '#B45309' }}>
                    {isDone ? 'Tamam' : isLate ? 'Gecikti!' : 'Yap →'}
                  </span>
                </a>
              )
            })}
          </div>
        )}

        {/* HEDEFLER */}
        {activeTab === 'goals' && (
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#1B3A6B', marginBottom: '14px' }}>🎯 Hedeflerim</div>
            {goals.length === 0 ? (
              <div style={{ background: '#F8FAFF', border: '1px solid #D5DFF0', borderRadius: '14px', padding: '32px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>🎯</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>Henüz hedef belirlenmedi</div>
              </div>
            ) : goals.map(g => {
              const progress = g.target_score > 0 ? Math.min(Math.round((g.current_score / g.target_score) * 100), 100) : 0
              const pColor = progress >= 80 ? '#2E7D52' : progress >= 50 ? '#B45309' : '#1B3A6B'
              return (
                <div key={g.id} style={{ background: '#fff', borderRadius: '14px', padding: '18px', marginBottom: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#1B3A6B' }}>{g.target_exam}</div>
                      <div style={{ fontSize: '11px', color: '#7A8FA8' }}>{g.target_date ? new Date(g.target_date).toLocaleDateString('tr-TR') : '—'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '24px', fontWeight: 800, color: '#1B3A6B' }}>{g.target_score}</div>
                      <div style={{ fontSize: '10px', color: '#7A8FA8' }}>hedef puan</div>
                    </div>
                  </div>
                  <div style={{ height: '10px', background: '#F0F4F9', borderRadius: '5px', overflow: 'hidden', marginBottom: '8px' }}>
                    <div style={{ height: '100%', width: progress + '%', background: pColor, borderRadius: '5px' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#7A8FA8' }}>
                    <span>Mevcut: {g.current_score}</span>
                    <span style={{ fontWeight: 700, color: pColor }}>%{progress}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* SWOT */}
        {activeTab === 'swot' && (
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#1B3A6B', marginBottom: '14px' }}>🔍 SWOT Analizim</div>
            {topicPerf.length === 0 ? (
              <div style={{ background: '#FDF4E7', border: '1px solid #FED7AA', borderRadius: '14px', padding: '32px', textAlign: 'center' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#B45309' }}>Yeterli veri yok</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { title: '💪 Güçlü Yönlerim', items: strongTopics, color: '#2E7D52', bg: '#EAF4EE', border: '#D1FAE5', empty: 'Henüz güçlü konu yok' },
                  { title: '📈 Gelişim Alanlarım', items: weakTopics, color: '#C0392B', bg: '#FEF2F2', border: '#FEE2E2', empty: 'Kritik zayıflık yok!' },
                  { title: '🎯 Fırsatlarım', items: midTopics, color: '#B45309', bg: '#FDF4E7', border: '#FEF3C7', empty: 'Orta seviye konu yok' },
                ].map(box => (
                  <div key={box.title} style={{ background: box.bg, border: '1px solid ' + box.border, borderRadius: '14px', padding: '14px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: box.color, marginBottom: '10px' }}>{box.title}</div>
                    {box.items.length === 0 ? (
                      <div style={{ fontSize: '12px', color: '#7A8FA8' }}>{box.empty}</div>
                    ) : box.items.slice(0, 4).map(t => (
                      <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(0,0,0,0.05)', fontSize: '12px' }}>
                        <span style={{ color: '#374151' }}>{t.subjects?.name} — {t.topics?.name ?? 'Genel'}</span>
                        <strong style={{ color: box.color }}>%{Math.round(t.accuracy_rate)}</strong>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}