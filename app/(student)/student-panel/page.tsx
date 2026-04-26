'use client'
export const dynamic = 'force-dynamic'

import AccessibilityWidget from '@/components/AccessibilityWidget'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'


function localDate(d: Date = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function getMonday(d: Date) {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const day = date.getDay()
  date.setDate(date.getDate() - day + (day === 0 ? -6 : 1))
  return date
}
function getWeekDays(start: Date) {
  return Array.from({ length: 7 }, (_, i) =>
    new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
  )
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

// ── DOĞRULAMA MODALI ──────────────────────────────────────────
function VerificationModal({ item, onVerified, onClose, supabase }: any) {
  const [step, setStep] = useState<'duration'|'question'|'done'>('duration')
  const [duration, setDuration] = useState('')
  const [question, setQuestion] = useState<any>(null)
  const [selectedAnswer, setSelectedAnswer] = useState('')
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<'correct'|'wrong'|null>(null)

  useEffect(() => { loadQuestion() }, [])

  async function loadQuestion() {
    if (item.subject_id) {
      const { data } = await supabase.from('verification_questions').select('*').eq('subject_id', item.subject_id).limit(20)
      if (data && data.length > 0) { setQuestion(data[Math.floor(Math.random() * data.length)]); return }
    }
    const { data } = await supabase.from('verification_questions').select('*').is('subject_id', null).limit(10)
    if (data && data.length > 0) setQuestion(data[Math.floor(Math.random() * data.length)])
  }

  async function submitVerification() {
    setSaving(true)
    const durationMins = parseInt(duration) || 0
    const expectedMin = Math.max(5, Math.round(item.duration_minutes * 0.3))
    const isSuspicious = durationMins < expectedMin
    const isCorrect = selectedAnswer === question?.correct_answer
    let suspicionReason = ''
    if (isSuspicious) suspicionReason += 'Çok kısa sürede tamamlandı. '
    if (!isCorrect) suspicionReason += 'Doğrulama sorusunu yanlış yanıtladı.'
    await supabase.from('study_calendar').update({
      status: 'completed', completed_at: new Date().toISOString(),
      actual_duration_minutes: durationMins,
      is_suspicious: isSuspicious || !isCorrect,
      suspicion_reason: suspicionReason || null,
      teacher_approved: isSuspicious || !isCorrect ? null : true,
      verification_answer: selectedAnswer,
      verification_score: isCorrect ? 100 : 0,
      score: isCorrect ? Math.floor(Math.random()*10)+90 : Math.floor(Math.random()*20)+60,
    }).eq('id', item.id)
    setResult(isCorrect ? 'correct' : 'wrong')
    setStep('done')
    setSaving(false)
    setTimeout(() => onVerified(), 2000)
  }

  return (
    <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'20px' }}>
      <div style={{ background:'#fff', borderRadius:'20px', padding:'24px', maxWidth:'400px', width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
        {step === 'duration' && (
          <>
            <div style={{ textAlign:'center', marginBottom:'20px' }}>
              <div style={{ fontSize:'40px', marginBottom:'10px' }}>⏱</div>
              <div style={{ fontSize:'17px', fontWeight:800, color:'#1B3A6B', marginBottom:'6px' }}>Ne kadar süre çalıştın?</div>
              <div style={{ fontSize:'13px', color:'#7A8FA8' }}>Planlanan: {item.duration_minutes} dakika</div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px', marginBottom:'14px' }}>
              {[15,20,30,40,45,60].map(min => (
                <button key={min} onClick={() => setDuration(String(min))} style={{ padding:'12px', borderRadius:'10px', border:'2px solid', borderColor:duration===String(min)?'#1B3A6B':'#E2EAF8', background:duration===String(min)?'#1B3A6B':'#F8FAFF', color:duration===String(min)?'#fff':'#1B3A6B', fontSize:'14px', fontWeight:700, cursor:'pointer' }}>
                  {min} dk
                </button>
              ))}
            </div>
            <input type="number" min={1} max={180} value={duration} onChange={e => setDuration(e.target.value)} placeholder="Başka süre (dk)" style={{ width:'100%', padding:'10px 14px', borderRadius:'10px', border:'1px solid #D5DFF0', fontSize:'14px', color:'#1B3A6B', outline:'none', boxSizing:'border-box', marginBottom:'14px' }} />
            <button onClick={() => duration ? setStep('question') : null} disabled={!duration} style={{ width:'100%', padding:'13px', borderRadius:'12px', background:duration?'#1B3A6B':'#D5DFF0', color:'#fff', fontSize:'14px', fontWeight:700, border:'none', cursor:duration?'pointer':'default' }}>Devam →</button>
            <button onClick={onClose} style={{ width:'100%', marginTop:'8px', padding:'10px', borderRadius:'10px', background:'transparent', color:'#9CA3AF', fontSize:'13px', border:'none', cursor:'pointer' }}>Vazgeç</button>
          </>
        )}
        {step === 'question' && question && (
          <>
            <div style={{ textAlign:'center', marginBottom:'18px' }}>
              <div style={{ fontSize:'40px', marginBottom:'10px' }}>🧠</div>
              <div style={{ fontSize:'17px', fontWeight:800, color:'#1B3A6B', marginBottom:'6px' }}>Hızlı kontrol!</div>
            </div>
            <div style={{ background:'#F8FAFF', borderRadius:'12px', padding:'14px', marginBottom:'14px', fontSize:'14px', fontWeight:600, color:'#1B3A6B', lineHeight:1.6 }}>{question.question}</div>
            <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'16px' }}>
              {['A','B','C','D'].map(opt => (
                <button key={opt} onClick={() => setSelectedAnswer(opt)} style={{ padding:'12px 16px', borderRadius:'10px', border:'2px solid', borderColor:selectedAnswer===opt?'#1B3A6B':'#E2EAF8', background:selectedAnswer===opt?'#1B3A6B':'#fff', color:selectedAnswer===opt?'#fff':'#374151', fontSize:'13px', fontWeight:selectedAnswer===opt?700:500, cursor:'pointer', textAlign:'left' }}>
                  <strong>{opt})</strong> {question['option_'+opt.toLowerCase()]}
                </button>
              ))}
            </div>
            <button onClick={submitVerification} disabled={!selectedAnswer||saving} style={{ width:'100%', padding:'13px', borderRadius:'12px', background:selectedAnswer?'#2E7D52':'#D5DFF0', color:'#fff', fontSize:'14px', fontWeight:700, border:'none', cursor:selectedAnswer?'pointer':'default' }}>
              {saving ? 'Kaydediliyor...' : 'Görevi Tamamla ✓'}
            </button>
          </>
        )}
        {step === 'done' && (
          <div style={{ textAlign:'center', padding:'10px 0' }}>
            <div style={{ fontSize:'52px', marginBottom:'14px' }}>{result==='correct'?'🎉':'📝'}</div>
            <div style={{ fontSize:'18px', fontWeight:800, color:result==='correct'?'#2E7D52':'#B45309', marginBottom:'8px' }}>
              {result==='correct' ? 'Harika! Doğru yanıt!' : 'Kayıt edildi!'}
            </div>
            <div style={{ fontSize:'13px', color:'#7A8FA8' }}>
              {result==='correct' ? 'Görev başarıyla tamamlandı.' : 'Öğretmenin değerlendirmesini bekliyor.'}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── ANA SAYFA ─────────────────────────────────────────────────
export default function StudentPanelPage() {
  const [profile, setProfile] = useState<any>(null)
  const [topicPerf, setTopicPerf] = useState<any[]>([])
  const [homework, setHomework] = useState<any[]>([])
  const [streak, setStreak] = useState<any>(null)
  const [badges, setBadges] = useState<any[]>([])
  const [dailyTasks, setDailyTasks] = useState<any[]>([])
  const [goals, setGoals] = useState<any[]>([])
  const [calendar, setCalendar] = useState<any[]>([])
  const [calendarNotes, setCalendarNotes] = useState<any[]>([])
  const [holidays, setHolidays] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState(localDate())
  const [calendarView, setCalendarView] = useState<'week'|'month'>('week')
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getMonday(new Date()))
  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date())
  const [verifyItem, setVerifyItem] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('today')
  const [celebration, setCelebration] = useState(false)
  const [celebrationMsg, setCelebrationMsg] = useState('')
  const [newBadge, setNewBadge] = useState<any>(null)
  const supabase = createClient()
  const todayStr = localDate()
  const [coachMessages, setCoachMessages] = useState<{role:'user'|'ai', text:string}[]>([
    { role:'ai', text:`Merhaba! Ben senin kişisel AI koçunum 🤖\n\nSana akademik konularda yardımcı olmak için buradayım. Zayıf konuların, çalışma planın veya motivasyon için her şeyi sorabilirsin!` }
  ])
  const [coachInput, setCoachInput] = useState('')
  const [coachLoading, setCoachLoading] = useState(false)
  const [wheelQuestion, setWheelQuestion]  = useState<any>(null)
  const [wheelSelected, setWheelSelected] = useState('')
  const [wheelResult, setWheelResult]     = useState<'correct'|'wrong'|null>(null)
  const [wheelExplain, setWheelExplain]   = useState('')
  const [wheelLoading, setWheelLoading]   = useState(false)
  const [wheelSpin, setWheelSpin]         = useState(false)
  const [wheelScore, setWheelScore]       = useState(0)
  const [wheelStreak, setWheelStreak]     = useState(0)
  const [wheelTotal, setWheelTotal]       = useState(0)
  const [wheelCorrect, setWheelCorrect]   = useState(0)
  const wheelGoal = 10
  const [examResults, setExamResults] = useState<any[]>([])

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    const { data: p } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()
    if (!p) { setLoading(false); return }
    setProfile(p)

    const [
      { data: tp }, { data: hw }, { data: st }, { data: sb },
      { data: dt }, { data: g }, { data: cal }, { data: notes }, { data: hols }, { data: exRes }
    ] = await Promise.all([
      supabase.from('student_topic_performance').select('*, topics(name), subjects(name)').eq('student_id', p.id).order('accuracy_rate', { ascending: true }),
      supabase.from('homework_assignments').select('*, tests(name, chapters(name, books(name)))').eq('student_id', p.id).order('created_at', { ascending: false }),
      supabase.from('student_streaks').select('*').eq('student_id', p.id).single(),
      supabase.from('student_badges').select('*, badges(*)').eq('student_id', p.id).order('earned_at', { ascending: false }),
      supabase.from('daily_tasks').select('*, subjects(name), topics(name)').eq('student_id', p.id).eq('task_date', todayStr).order('status'),
      supabase.from('student_goals').select('*').eq('student_id', p.id).eq('status', 'active'),
      supabase.from('study_calendar').select('*, subjects(name), topics(name)').eq('student_id', p.id).order('calendar_date'),
      supabase.from('calendar_notes').select('*, profiles!calendar_notes_teacher_id_fkey(full_name)').eq('student_id', p.id).order('calendar_date', { ascending: false }),
      supabase.from('public_holidays').select('*').order('holiday_date'),
      supabase.from('exam_results').select('*, exams(id, name, exam_date, exam_type), subjects(id, name, color, section)').eq('student_id', p.id).order('created_at', { ascending: true }),
    ])

    const prevCount = badges.length
    const newBadges = sb ?? []
    if (newBadges.length > prevCount && prevCount > 0) {
      setNewBadge(newBadges[0])
      setTimeout(() => setNewBadge(null), 4000)
    }

    setTopicPerf(tp ?? [])
    setHomework(hw ?? [])
    setStreak(st)
    setBadges(newBadges)
    setDailyTasks(dt ?? [])
    setGoals(g ?? [])
    setCalendar(cal ?? [])
    setCalendarNotes(notes ?? [])
    setHolidays(hols ?? [])
    setExamResults(exRes ?? [])
    setLoading(false)
  }

  // ── ROZET OTOMASYonu ─────────────────────────────────────────
  async function awardBadges(studentId: string) {
    const { data: allBadges } = await supabase.from('badges').select('*').not('condition_type', 'is', null)
    if (!allBadges || allBadges.length === 0) return

    const { data: earnedData } = await supabase.from('student_badges').select('badge_id').eq('student_id', studentId)
    const earned = new Set((earnedData ?? []).map((b: any) => b.badge_id))

    const { data: stData } = await supabase.from('student_streaks').select('*').eq('student_id', studentId).single()
    const { count: taskCount } = await supabase.from('daily_tasks').select('*', { count:'exact', head:true }).eq('student_id', studentId).eq('status', 'completed')
    const { count: calCount } = await supabase.from('study_calendar').select('*', { count:'exact', head:true }).eq('student_id', studentId).eq('status', 'completed')
    const { count: hwCount } = await supabase.from('homework_assignments').select('*', { count:'exact', head:true }).eq('student_id', studentId).eq('status', 'completed')
    const { data: perfData } = await supabase.from('student_topic_performance').select('correct_count, total_questions').eq('student_id', studentId)

    const totalQ = (perfData ?? []).reduce((s: number, t: any) => s + t.total_questions, 0)
    const totalC = (perfData ?? []).reduce((s: number, t: any) => s + t.correct_count, 0)
    const accuracy = totalQ > 0 ? (totalC / totalQ) * 100 : 0
    const currentStreak = stData?.current_streak ?? 0
    let newBadgeFound: any = null

    for (const badge of allBadges) {
      if (earned.has(badge.id)) continue
      let met = false
      if (badge.condition_type === 'streak'   && currentStreak      >= badge.condition_value) met = true
      if (badge.condition_type === 'tasks'    && (taskCount ?? 0)   >= badge.condition_value) met = true
      if (badge.condition_type === 'calendar' && (calCount ?? 0)    >= badge.condition_value) met = true
      if (badge.condition_type === 'accuracy' && accuracy           >= badge.condition_value) met = true
      if (badge.condition_type === 'homework' && (hwCount ?? 0)     >= badge.condition_value) met = true

      if (met) {
        const { data: inserted } = await supabase.from('student_badges').insert({ student_id: studentId, badge_id: badge.id, earned_at: new Date().toISOString() }).select('*, badges(*)').single()
        await supabase.from('student_streaks').update({ total_points: (stData?.total_points ?? 0) + (badge.points ?? 100), updated_at: new Date().toISOString() }).eq('student_id', studentId)
        if (!newBadgeFound && inserted) newBadgeFound = inserted
      }
    }

    if (newBadgeFound) {
      setNewBadge(newBadgeFound)
      setTimeout(() => setNewBadge(null), 4000)
    }
  }

  async function startCalendarItem(id: string) {
    const item = calendar.find(c => c.id === id)
    if (!item) return
    await supabase.from('study_calendar').update({ started_at: new Date().toISOString() }).eq('id', id)
    setVerifyItem(item)
  }

  async function sendCoachMessage() {
    if (!coachInput.trim() || coachLoading) return
    const userMsg = coachInput.trim()
    setCoachInput('')
    setCoachMessages(prev => [...prev, { role:'user', text:userMsg }])
    setCoachLoading(true)
  
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'coach',
          student_name: profile?.full_name?.split(' ')[0],
          overall_rate: overallRate,
          streak: streak?.current_streak ?? 0,
          weak_topics: weakTopics.map(t => t.subjects?.name + ' - ' + t.topics?.name).join(', '),
          strong_topics: strongTopics.map(t => t.topics?.name).join(', '),
          pending_homework: pendingHw,
          daily_score: dailyScore,
          user_message: userMsg,
        }),
      })
      const data = await res.json()
      setCoachMessages(prev => [...prev, { role:'ai', text: data.response ?? 'Üzgünüm, bir hata oluştu.' }])
    } catch {
      setCoachMessages(prev => [...prev, { role:'ai', text: 'Bağlantı hatası. Lütfen tekrar dene.' }])
    }
    setCoachLoading(false)
  }
  async function completeTask(taskId: string) {
    const task = dailyTasks.find(t => t.id === taskId)
    if (!task) return
    const score = Math.floor(Math.random()*20)+80
    await supabase.from('daily_tasks').update({ status:'completed', completed_at:new Date().toISOString(), score }).eq('id', taskId)
    if (streak) {
      const yesterday = localDate(new Date(Date.now()-86400000))
      const newStreak = streak.last_active_date === todayStr ? streak.current_streak : (streak.last_active_date === yesterday ? streak.current_streak+1 : 1)
      await supabase.from('student_streaks').update({
        current_streak: newStreak,
        longest_streak: Math.max(newStreak, streak.longest_streak ?? 0),
        last_active_date: todayStr,
        total_points: (streak.total_points ?? 0) + score,
        daily_score: Math.min((streak.daily_score ?? 0) + score, 100),
        updated_at: new Date().toISOString()
      }).eq('student_id', profile.id)
    }
    await awardBadges(profile.id)
    const remaining = dailyTasks.filter(t => t.status==='pending' && t.id!==taskId).length
    if (remaining === 0) { setCelebrationMsg('Tüm görevleri tamamladın! 🎉'); setCelebration(true); setTimeout(()=>setCelebration(false),4000) }
    else { setCelebrationMsg(score+' puan kazandın! ⭐'); setCelebration(true); setTimeout(()=>setCelebration(false),2000) }
    await load()
  }

  async function spinWheel() {
    setWheelSpin(true); setWheelQuestion(null); setWheelSelected(''); setWheelResult(null); setWheelExplain('')
    await new Promise(r => setTimeout(r, 1000))
    const { data: questions } = await supabase.from('verification_questions').select('*, subjects(name), topics(name)').limit(60)
    if (!questions || questions.length === 0) { setWheelSpin(false); return }
    setWheelQuestion(questions[Math.floor(Math.random() * questions.length)])
    setWheelSpin(false)
  }

  async function answerWheel(option: string) {
    if (!wheelQuestion || wheelResult) return
    setWheelSelected(option)
    const isCorrect = option === wheelQuestion.correct_answer
    setWheelResult(isCorrect ? 'correct' : 'wrong')
    setWheelTotal(p => p + 1)
    if (isCorrect) {
      setWheelCorrect(p => p + 1)
      setWheelScore(p => p + 10)
      setWheelStreak(p => p + 1)
      const newStreak = wheelStreak + 1
      if (newStreak > 0 && newStreak % 5 === 0) {
        setCelebrationMsg(newStreak + ' dogru ust uste! Harika!'); setCelebration(true); setTimeout(() => setCelebration(false), 2500)
      }
    } else {
      setWheelStreak(0)
      setWheelLoading(true)
      try {
        const res = await fetch('/api/ai', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ type:'coach', student_name: profile?.full_name?.split(' ')[0], overall_rate: 0, streak: streak?.current_streak??0, weak_topics:'', strong_topics:'', pending_homework:0, daily_score: 0, user_message: '"' + wheelQuestion.question + '" sorusunun dogru cevabi "' + wheelQuestion.correct_answer + '" secenegidir. Bu soruyu kisa ve anlasılır sekilde aciklar misin? (2-3 cumle)' })
        })
        const d = await res.json()
        setWheelExplain(d.response ?? '')
      } catch { setWheelExplain('') }
      setWheelLoading(false)
    }
    if (wheelCorrect + (isCorrect ? 1 : 0) >= wheelGoal) {
      setTimeout(() => { setCelebrationMsg('Gunluk hedefe ulastın! ' + wheelGoal + ' dogru!'); setCelebration(true); setTimeout(() => setCelebration(false), 4000) }, 1500)
    }
  }

  async function signOut() { await supabase.auth.signOut(); window.location.href = '/login' }

  function getCalForDate(d: string) { return calendar.filter(c => c.calendar_date === d) }
  function getNoteForDate(d: string) { return calendarNotes.find(n => n.calendar_date === d) }
  function getHoliday(d: string) { return holidays.find(h => h.holiday_date === d) }

  const weekDays = getWeekDays(currentWeekStart)
  const monthDays = getMonthDays(currentMonth)
  const DAYS_SHORT = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz']
  const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']

  const selectedItems = getCalForDate(selectedDate)
  const selectedNote = getNoteForDate(selectedDate)
  const selectedHoliday = getHoliday(selectedDate)

  const totalQ = topicPerf.reduce((s,t)=>s+t.total_questions,0)
  const totalC = topicPerf.reduce((s,t)=>s+t.correct_count,0)
  const overallRate = totalQ>0 ? Math.round(totalC/totalQ*100) : 0
  const pendingHw = homework.filter(h=>h.status!=='completed').length
  const completedTasks = dailyTasks.filter(t=>t.status==='completed').length
  const dailyProgress = dailyTasks.length>0 ? Math.round(completedTasks/dailyTasks.length*100) : 0
  const dailyScore = streak?.daily_score ?? 0
  const weakTopics = topicPerf.filter(t=>t.accuracy_rate<50)
  const strongTopics = topicPerf.filter(t=>t.accuracy_rate>=70)
  const midTopics = topicPerf.filter(t=>t.accuracy_rate>=50&&t.accuracy_rate<70)

  const evalStyle: any = {
    good: { bg:'#EAF4EE', color:'#2E7D52', label:'✓ Yeterli' },
    warning: { bg:'#FDF4E7', color:'#B45309', label:'⚠ Dikkat' },
    insufficient: { bg:'#FEF2F2', color:'#C0392B', label:'✗ Yetersiz' },
  }

  function fb() {
    if (dailyScore>=96) return { msg:'Muhteşem! Sen bir yıldızsın!', color:'#B45309', bg:'#FDF4E7', emoji:'🌟' }
    if (dailyScore>=76) return { msg:'Harika gidiyorsun!', color:'#2E7D52', bg:'#EAF4EE', emoji:'⭐' }
    if (dailyScore>=50) return { msg:'İyi iş, devam et!', color:'#1B3A6B', bg:'#EEF3FB', emoji:'💪' }
    return { msg:'Bugün daha fazlasını yapabilirsin!', color:'#7A8FA8', bg:'#F0F4F9', emoji:'🎯' }
  }
  const feedback = fb()

  const holidayLegend = [
    { color:'#1B3A6B', bg:'#EEF3FB', label:'Resmi Tatil' },
    { color:'#2E7D52', bg:'#EAF4EE', label:'Dini Bayram' },
    { color:'#5B21B6', bg:'#EDE9FE', label:'Okul Tatili' },
  ]

  const TABS = [
    { id:'today',    label:'Bugün',    icon:'📅' },
    { id:'calendar', label:'Takvim',   icon:'🗓' },
    { id:'performance', label:'Performans', icon:'📊' },
    { id:'homework', label:'Ödevler',  icon:'📚' },
    { id:'goals',    label:'Hedefler', icon:'🎯' },
    { id:'coach',    label:'AI Coach', icon:'🤖' },  // ← YENİ
    { id:'wheel',   label:'Soru Carki', icon:'🎡' },
    { id:'exams',    label:'Sinavlar',  icon:'📝' },
    { id:'swot',     label:'SWOT',     icon:'🔍' },
  ]

  if (loading) return (
    <div style={{ display:'flex', height:'100vh', alignItems:'center', justifyContent:'center', background:'#F0F4F9' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:'40px', marginBottom:'12px' }}>📚</div>
        <div style={{ fontSize:'14px', color:'#7A8FA8' }}>Yükleniyor...</div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#F0F4F9', fontFamily:'-apple-system, BlinkMacSystemFont, sans-serif' }}>

      {/* Yeni Rozet Bildirimi */}
      {newBadge && (
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, display:'flex', alignItems:'center', justifyContent:'center', zIndex:1001, background:'rgba(0,0,0,0.5)', pointerEvents:'none' }}>
          <div style={{ background:'#1B3A6B', borderRadius:'24px', padding:'32px 40px', textAlign:'center', boxShadow:'0 20px 60px rgba(0,0,0,0.4)' }}>
            <div style={{ fontSize:'64px', marginBottom:'12px' }}>{newBadge.badges?.icon ?? '🏅'}</div>
            <div style={{ fontSize:'14px', color:'rgba(255,255,255,0.7)', marginBottom:'6px' }}>Yeni Rozet Kazandın!</div>
            <div style={{ fontSize:'22px', fontWeight:800, color:'#fff', marginBottom:'6px' }}>{newBadge.badges?.name}</div>
            <div style={{ fontSize:'13px', color:'rgba(255,255,255,0.6)' }}>{newBadge.badges?.description}</div>
          </div>
        </div>
      )}

      {/* Doğrulama Modalı */}
      {verifyItem && (
        <VerificationModal
          item={verifyItem}
          supabase={supabase}
          onVerified={async () => {
            setVerifyItem(null)
            await awardBadges(profile.id)
            setCelebrationMsg('Görev tamamlandı! 🎉')
            setCelebration(true)
            setTimeout(() => setCelebration(false), 3000)
            await load()
          }}
          onClose={() => setVerifyItem(null)}
        />
      )}

      {/* Kutlama */}
      {celebration && (
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, display:'flex', alignItems:'center', justifyContent:'center', zIndex:999, pointerEvents:'none', background:'rgba(0,0,0,0.3)' }}>
          <div style={{ background:'#1B3A6B', borderRadius:'20px', padding:'28px 40px', textAlign:'center' }}>
            <div style={{ fontSize:'52px', marginBottom:'10px' }}>🎉</div>
            <div style={{ fontSize:'20px', fontWeight:800, color:'#fff' }}>{celebrationMsg}</div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ background:'#1B3A6B', padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', fontWeight:800, color:'#fff' }}>D</div>
          <div>
            <div style={{ fontSize:'13px', fontWeight:700, color:'#fff' }}>DershaneOPS</div>
            <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.6)' }}>{profile?.full_name?.split(' ')[0]}</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          {streak && (
            <div style={{ display:'flex', alignItems:'center', gap:'4px', background:'rgba(255,255,255,0.1)', padding:'5px 10px', borderRadius:'20px' }}>
              <span style={{ fontSize:'14px' }}>🔥</span>
              <span style={{ fontSize:'12px', fontWeight:700, color:'#fff' }}>{streak.current_streak}</span>
            </div>
          )}
          <button onClick={signOut} style={{ background:'rgba(255,255,255,0.1)', border:'none', borderRadius:'8px', padding:'6px 10px', color:'#fff', fontSize:'12px', cursor:'pointer' }}>Çıkış</button>
        </div>
      </div>

      {/* Skor bar */}
      {streak && (
        <div style={{ background:'#fff', padding:'8px 16px', display:'flex', alignItems:'center', gap:'10px', borderBottom:'1px solid #F0F4F9' }}>
          <div style={{ flex:1, height:'6px', background:'#F0F4F9', borderRadius:'3px', overflow:'hidden' }}>
            <div style={{ height:'100%', width:dailyScore+'%', background:dailyScore>=75?'#2E7D52':dailyScore>=50?'#B45309':'#1B3A6B', borderRadius:'3px', transition:'width 0.5s' }} />
          </div>
          <span style={{ fontSize:'11px', fontWeight:700, color:'#1B3A6B' }}>{dailyScore}/100</span>
          <span style={{ fontSize:'13px' }}>{feedback.emoji}</span>
        </div>
      )}

      {/* Alt Tab Bar */}
      <nav aria-label="Ana navigasyon" style={{ position:'fixed', bottom:0, left:0, right:0, background:'#fff', borderTop:'1px solid #E2EAF8', display:'flex', zIndex:100, paddingBottom:'env(safe-area-inset-bottom)' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} aria-label={tab.label} aria-selected={activeTab===tab.id} role="tab" style={{ flex:1, padding:'8px 4px 10px', border:'none', background:'transparent', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:'2px' }}>
            <span style={{ fontSize:'18px' }}>{tab.icon}</span>
            <span style={{ fontSize:'9px', fontWeight:activeTab===tab.id?700:500, color:activeTab===tab.id?'#1B3A6B':'#9CA3AF' }}>{tab.label}</span>
            {activeTab===tab.id && <div style={{ width:'4px', height:'4px', borderRadius:'50%', background:'#1B3A6B' }} />}
          </button>
        ))}
      </div>

      <div style={{ padding:'16px 16px 80px' }}>

        {/* ── BUGÜN ── */}
        {activeTab === 'today' && (
          <div>
            <div style={{ background:'linear-gradient(135deg, #1B3A6B 0%, #2563EB 100%)', borderRadius:'16px', padding:'18px', marginBottom:'14px', color:'#fff' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <div style={{ fontSize:'18px', fontWeight:800, marginBottom:'4px' }}>Merhaba, {profile?.full_name?.split(' ')[0]}! 👋</div>
                  <div style={{ fontSize:'12px', opacity:0.7 }}>{new Date().toLocaleDateString('tr-TR', { weekday:'long', day:'numeric', month:'long' })}</div>
                </div>
                <div style={{ textAlign:'center', background:'rgba(255,255,255,0.15)', borderRadius:'12px', padding:'8px 14px' }}>
                  <div style={{ fontSize:'28px', fontWeight:800 }}>{dailyProgress}%</div>
                  <div style={{ fontSize:'10px', opacity:0.7 }}>Bugün</div>
                </div>
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px', marginBottom:'14px' }}>
              {[
                { label:'Seri', value:(streak?.current_streak??0)+' gün', icon:'🔥', color:'#B45309', bg:'#FDF4E7' },
                { label:'Puan', value:streak?.total_points??0, icon:'💎', color:'#6B4FC8', bg:'#F0ECFB' },
                { label:'Rozet', value:badges.length, icon:'🏅', color:'#2E7D52', bg:'#EAF4EE' },
              ].map(m => (
                <div key={m.label} style={{ background:m.bg, borderRadius:'14px', padding:'14px 10px', textAlign:'center' }}>
                  <div style={{ fontSize:'22px', marginBottom:'4px' }}>{m.icon}</div>
                  <div style={{ fontSize:'16px', fontWeight:800, color:m.color }}>{m.value}</div>
                  <div style={{ fontSize:'10px', color:'#7A8FA8' }}>{m.label}</div>
                </div>
              ))}
            </div>

            {streak && (
              <div style={{ background:feedback.bg, borderRadius:'12px', padding:'12px 14px', marginBottom:'14px', display:'flex', alignItems:'center', gap:'10px' }}>
                <span style={{ fontSize:'24px' }}>{feedback.emoji}</span>
                <div>
                  <div style={{ fontSize:'13px', fontWeight:700, color:feedback.color }}>{feedback.msg}</div>
                  <div style={{ fontSize:'11px', color:'#7A8FA8' }}>Günlük skor: {dailyScore}/100</div>
                </div>
              </div>
            )}

            {/* Bugünün takvim görevleri */}
            {getCalForDate(todayStr).length > 0 && (
              <div style={{ background:'#fff', borderRadius:'14px', overflow:'hidden', marginBottom:'14px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ padding:'12px 16px', borderBottom:'1px solid #F0F4F9', display:'flex', alignItems:'center', gap:'8px' }}>
                  <span style={{ fontSize:'16px' }}>🗓</span>
                  <div style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B' }}>Bugünün Çalışma Takvimi</div>
                </div>
                {getCalForDate(todayStr).map((item, i) => {
                  const isDone = item.status==='completed'
                  return (
                    <div key={item.id} style={{ padding:'12px 16px', borderBottom:i<getCalForDate(todayStr).length-1?'1px solid #F0F4F9':'none', display:'flex', alignItems:'center', gap:'12px', background:isDone?'#F8FFF8':'#fff' }}>
                      <div style={{ width:'42px', height:'42px', borderRadius:'10px', background:isDone?'#EAF4EE':'#EEF3FB', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        {isDone ? <span style={{ fontSize:'18px', color:'#2E7D52' }}>✓</span> : <><div style={{ fontSize:'12px', fontWeight:800, color:'#1B3A6B' }}>{item.duration_minutes}</div><div style={{ fontSize:'8px', color:'#7A8FA8' }}>dk</div></>}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:'13px', fontWeight:700, color:isDone?'#7A8FA8':'#1B3A6B', textDecoration:isDone?'line-through':'none', marginBottom:'2px' }}>{item.title}</div>
                        <div style={{ fontSize:'11px', color:'#7A8FA8' }}>{item.subjects?.name}{item.topics?.name?' — '+item.topics.name:''}</div>
                        {isDone&&item.is_suspicious&&item.teacher_approved===null && <div style={{ fontSize:'10px', color:'#B45309', marginTop:'2px' }}>⏳ Öğretmen onayı bekleniyor</div>}
                        {isDone&&item.teacher_approved===true && <div style={{ fontSize:'10px', color:'#2E7D52', marginTop:'2px' }}>✓ Öğretmen onayladı</div>}
                        {isDone&&item.teacher_approved===false && <div style={{ fontSize:'10px', color:'#C0392B', marginTop:'2px' }}>✗ Öğretmen reddetti</div>}
                      </div>
                      {isDone ? (
                        <div style={{ textAlign:'center' }}>
                          <div style={{ fontSize:'16px', fontWeight:800, color:'#2E7D52' }}>{item.score}</div>
                          <div style={{ fontSize:'9px', color:'#7A8FA8' }}>puan</div>
                        </div>
                      ) : (
                        <button onClick={() => startCalendarItem(item.id)} style={{ padding:'8px 12px', borderRadius:'20px', background:'#1B3A6B', color:'#fff', fontSize:'12px', fontWeight:700, border:'none', cursor:'pointer', whiteSpace:'nowrap' }}>Yaptım!</button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Günlük Görevler */}
            <div style={{ background:'#fff', borderRadius:'16px', overflow:'hidden', marginBottom:'14px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ padding:'14px 16px', borderBottom:'1px solid #F0F4F9', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ fontSize:'14px', fontWeight:700, color:'#1B3A6B' }}>📋 Günlük Görevler</div>
                <span style={{ fontSize:'12px', fontWeight:700, padding:'3px 10px', borderRadius:'20px', background:completedTasks===dailyTasks.length&&dailyTasks.length>0?'#EAF4EE':'#EEF3FB', color:completedTasks===dailyTasks.length&&dailyTasks.length>0?'#2E7D52':'#1B3A6B' }}>
                  {completedTasks}/{dailyTasks.length}
                </span>
              </div>
              {dailyTasks.length===0 ? (
                <div style={{ padding:'32px', textAlign:'center' }}>
                  <div style={{ fontSize:'32px', marginBottom:'8px' }}>🎉</div>
                  <div style={{ fontSize:'13px', fontWeight:600, color:'#2E7D52' }}>Bugün için görev yok!</div>
                </div>
              ) : dailyTasks.map((task, i) => {
                const isDone = task.status==='completed'
                return (
                  <div key={task.id} style={{ padding:'14px 16px', borderBottom:i<dailyTasks.length-1?'1px solid #F0F4F9':'none', display:'flex', alignItems:'center', gap:'12px', background:isDone?'#F8FFF8':'#fff' }}>
                    <button onClick={() => !isDone&&completeTask(task.id)} style={{ width:'44px', height:'44px', borderRadius:'50%', background:isDone?'#2E7D52':'#EEF3FB', border:isDone?'none':'2px solid #D5DFF0', display:'flex', alignItems:'center', justifyContent:'center', cursor:isDone?'default':'pointer', flexShrink:0, fontSize:'18px' }}>
                      {isDone?'✓':'📖'}
                    </button>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:'13px', fontWeight:700, color:isDone?'#7A8FA8':'#1B3A6B', textDecoration:isDone?'line-through':'none', marginBottom:'2px' }}>
                        {task.subjects?.name??'Genel'}{task.topics?.name?' — '+task.topics.name:''}
                      </div>
                      <div style={{ fontSize:'11px', color:'#7A8FA8' }}>{task.target_duration_minutes} dk</div>
                    </div>
                    {isDone ? (
                      <div style={{ textAlign:'center' }}>
                        <div style={{ fontSize:'16px', fontWeight:800, color:'#2E7D52' }}>{task.score}</div>
                        <div style={{ fontSize:'9px', color:'#7A8FA8' }}>puan</div>
                      </div>
                    ) : (
                      <button onClick={() => completeTask(task.id)} style={{ padding:'8px 14px', borderRadius:'20px', background:'#1B3A6B', color:'#fff', fontSize:'12px', fontWeight:700, border:'none', cursor:'pointer' }}>Yaptım!</button>
                    )}
                  </div>
                )
              })}
            </div>

            {pendingHw>0 && (
              <div onClick={() => setActiveTab('homework')} style={{ background:'#FDF4E7', borderRadius:'12px', padding:'14px 16px', border:'1px solid #FED7AA', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <span style={{ fontSize:'22px' }}>📝</span>
                  <div>
                    <div style={{ fontSize:'13px', fontWeight:700, color:'#B45309' }}>{pendingHw} bekleyen ödev var</div>
                    <div style={{ fontSize:'11px', color:'#7A8FA8' }}>Görmek için tıkla</div>
                  </div>
                </div>
                <span style={{ fontSize:'18px', color:'#B45309' }}>→</span>
              </div>
            )}

            {/* Rozetler */}
            {badges.length > 0 && (
              <div style={{ background:'#fff', borderRadius:'14px', padding:'14px 16px', marginTop:'14px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B', marginBottom:'12px' }}>🏅 Kazanılan Rozetler</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
                  {badges.map(sb => (
                    <div key={sb.id} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'4px', padding:'10px', borderRadius:'12px', background:'#F8FAFF', border:'1px solid #E2EAF8', minWidth:'60px' }}>
                      <span style={{ fontSize:'24px' }}>{sb.badges?.icon}</span>
                      <span style={{ fontSize:'9px', fontWeight:600, color:'#1B3A6B', textAlign:'center' }}>{sb.badges?.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAKVİM ── */}
        {activeTab === 'calendar' && (
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
              <div style={{ fontSize:'16px', fontWeight:700, color:'#1B3A6B' }}>🗓 Çalışma Takvimim</div>
              <div style={{ display:'flex', gap:'4px', background:'#F0F4F9', borderRadius:'8px', padding:'3px' }}>
                {(['week','month'] as const).map(v => (
                  <button key={v} onClick={() => setCalendarView(v)} style={{ padding:'5px 12px', borderRadius:'6px', border:'none', background:calendarView===v?'#fff':'transparent', color:calendarView===v?'#1B3A6B':'#9CA3AF', fontSize:'12px', fontWeight:calendarView===v?700:500, cursor:'pointer' }}>
                    {v==='week'?'Hafta':'Ay'}
                  </button>
                ))}
              </div>
            </div>

            {/* Tatil açıklama bandı */}
            <div style={{ display:'flex', gap:'10px', marginBottom:'10px', flexWrap:'wrap' }}>
              {holidayLegend.map(h => (
                <div key={h.label} style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                  <div style={{ width:'10px', height:'10px', borderRadius:'2px', background:h.bg, border:'1.5px solid '+h.color }} />
                  <span style={{ fontSize:'10px', color:'#7A8FA8' }}>{h.label}</span>
                </div>
              ))}
            </div>

            {calendarView === 'week' && (
              <div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
                  <button onClick={() => setCurrentWeekStart(d => new Date(d.getFullYear(),d.getMonth(),d.getDate()-7))} style={{ padding:'6px 12px', borderRadius:'8px', border:'1px solid #D5DFF0', background:'#fff', cursor:'pointer', fontSize:'16px' }}>‹</button>
                  <span style={{ fontSize:'12px', fontWeight:700, color:'#1B3A6B' }}>
                    {currentWeekStart.toLocaleDateString('tr-TR', { day:'numeric', month:'short' })} — {weekDays[6].toLocaleDateString('tr-TR', { day:'numeric', month:'short' })}
                  </span>
                  <button onClick={() => setCurrentWeekStart(d => new Date(d.getFullYear(),d.getMonth(),d.getDate()+7))} style={{ padding:'6px 12px', borderRadius:'8px', border:'1px solid #D5DFF0', background:'#fff', cursor:'pointer', fontSize:'16px' }}>›</button>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'4px', marginBottom:'14px' }}>
                  {weekDays.map((day, i) => {
                    const dateStr = localDate(day)
                    const items = getCalForDate(dateStr)
                    const note = getNoteForDate(dateStr)
                    const holiday = getHoliday(dateStr)
                    const isToday = dateStr===todayStr
                    const isSelected = dateStr===selectedDate
                    const isWeekend = i>=5
                    const completedCount = items.filter(x=>x.status==='completed').length
                    const hasSuspicious = items.some(x=>x.is_suspicious&&x.teacher_approved===null)
                    return (
                      <button key={i} onClick={() => setSelectedDate(dateStr)}
                        style={{ padding:'8px 3px', borderRadius:'10px', border:'2px solid', borderColor:isSelected?'#1B3A6B':holiday?holiday.color:isToday?'#93C5FD':'#E2EAF8', background:isSelected?'#1B3A6B':holiday?holiday.color+'25':isToday?'#EEF3FB':isWeekend?'#F8FAFC':'#fff', cursor:'pointer', textAlign:'center' }}>
                        <div style={{ fontSize:'9px', color:isSelected?'rgba(255,255,255,0.7)':'#9CA3AF', marginBottom:'2px' }}>{DAYS_SHORT[i]}</div>
                        <div style={{ fontSize:'14px', fontWeight:700, color:isSelected?'#fff':holiday&&!isToday?holiday.color:isToday?'#1B3A6B':'#374151' }}>{day.getDate()}</div>
                        {holiday&&!isSelected && <div style={{ width:'6px', height:'2px', borderRadius:'1px', background:holiday.color, margin:'2px auto 0' }} />}
                        {items.length>0 && (
                          <div style={{ display:'flex', justifyContent:'center', gap:'2px', marginTop:'2px' }}>
                            {items.slice(0,3).map((_,idx)=>(
                              <div key={idx} style={{ width:'5px', height:'5px', borderRadius:'50%', background:idx<completedCount?'#2E7D52':(isSelected?'rgba(255,255,255,0.5)':'#93C5FD') }} />
                            ))}
                          </div>
                        )}
                        {hasSuspicious && <div style={{ fontSize:'9px', marginTop:'1px' }}>⏳</div>}
                        {note&&!hasSuspicious && <div style={{ width:'5px', height:'5px', borderRadius:'50%', background:note.evaluation==='good'?'#2E7D52':note.evaluation==='warning'?'#B45309':'#C0392B', margin:'2px auto 0' }} />}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {calendarView === 'month' && (
              <div style={{ marginBottom:'14px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
                  <button onClick={() => setCurrentMonth(d => new Date(d.getFullYear(),d.getMonth()-1,1))} style={{ padding:'6px 12px', borderRadius:'8px', border:'1px solid #D5DFF0', background:'#fff', cursor:'pointer', fontSize:'16px' }}>‹</button>
                  <span style={{ fontSize:'14px', fontWeight:700, color:'#1B3A6B' }}>{MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
                  <button onClick={() => setCurrentMonth(d => new Date(d.getFullYear(),d.getMonth()+1,1))} style={{ padding:'6px 12px', borderRadius:'8px', border:'1px solid #D5DFF0', background:'#fff', cursor:'pointer', fontSize:'16px' }}>›</button>
                </div>
                <div style={{ background:'#fff', borderRadius:'14px', padding:'12px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'2px', marginBottom:'6px' }}>
                    {DAYS_SHORT.map(d=><div key={d} style={{ textAlign:'center', fontSize:'9px', fontWeight:700, color:'#9CA3AF', padding:'3px 0' }}>{d}</div>)}
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'3px' }}>
                    {monthDays.map((day,i) => {
                      if (!day) return <div key={i} />
                      const dateStr = localDate(day)
                      const items = getCalForDate(dateStr)
                      const note = getNoteForDate(dateStr)
                      const holiday = getHoliday(dateStr)
                      const isToday = dateStr===todayStr
                      const isSelected = dateStr===selectedDate
                      const isWeekend = day.getDay()===0||day.getDay()===6
                      const completedCount = items.filter(x=>x.status==='completed').length
                      return (
                        <button key={i} onClick={() => setSelectedDate(dateStr)}
                          style={{ padding:'5px 2px', borderRadius:'8px', border:'2px solid', borderColor:isSelected?'#1B3A6B':holiday?holiday.color:isToday?'#93C5FD':'transparent', background:isSelected?'#1B3A6B':holiday?holiday.color+'18':isToday?'#EEF3FB':isWeekend?'#F8FAFC':'transparent', cursor:'pointer', textAlign:'center', minHeight:'36px' }}>
                          <div style={{ fontSize:'12px', fontWeight:isToday?800:500, color:isSelected?'#fff':holiday?holiday.color:'#374151' }}>{day.getDate()}</div>
                          {items.length>0 && (
                            <div style={{ display:'flex', justifyContent:'center', gap:'1px', marginTop:'2px' }}>
                              {items.slice(0,3).map((_,idx)=>(
                                <div key={idx} style={{ width:'4px', height:'4px', borderRadius:'50%', background:idx<completedCount?'#2E7D52':(isSelected?'rgba(255,255,255,0.5)':'#93C5FD') }} />
                              ))}
                            </div>
                          )}
                          {note && <div style={{ width:'4px', height:'4px', borderRadius:'50%', background:note.evaluation==='good'?'#2E7D52':note.evaluation==='warning'?'#B45309':'#C0392B', margin:'2px auto 0' }} />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Seçili gün detayı */}
            <div style={{ background:'#fff', borderRadius:'14px', overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ padding:'12px 16px', background:'#F8FAFF', borderBottom:'1px solid #F0F4F9' }}>
                <div style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B' }}>
                  {new Date(selectedDate+'T12:00:00').toLocaleDateString('tr-TR', { weekday:'long', day:'numeric', month:'long' })}
                </div>
                {selectedHoliday && (
                  <div style={{ fontSize:'11px', fontWeight:600, color:selectedHoliday.color, marginTop:'4px', padding:'4px 10px', background:selectedHoliday.color+'15', borderRadius:'6px', display:'inline-flex', alignItems:'center', gap:'5px' }}>
                    🚩 {selectedHoliday.name}
                  </div>
                )}
                {selectedNote && (
                  <span style={{ fontSize:'11px', fontWeight:700, padding:'3px 10px', borderRadius:'20px', background:evalStyle[selectedNote.evaluation]?.bg, color:evalStyle[selectedNote.evaluation]?.color, display:'inline-block', marginTop:'4px' }}>
                    {evalStyle[selectedNote.evaluation]?.label}
                  </span>
                )}
              </div>
              {selectedNote?.note && (
                <div style={{ padding:'12px 16px', background:'#EEF3FB', borderBottom:'1px solid #F0F4F9', display:'flex', gap:'10px' }}>
                  <span style={{ fontSize:'16px' }}>👨‍🏫</span>
                  <div>
                    <div style={{ fontSize:'10px', color:'#7A8FA8', marginBottom:'3px' }}>Öğretmen Notu — {selectedNote.profiles?.full_name}</div>
                    <div style={{ fontSize:'12.5px', color:'#1B3A6B', lineHeight:1.6 }}>{selectedNote.note}</div>
                  </div>
                </div>
              )}
              {selectedItems.length===0 ? (
                <div style={{ padding:'28px', textAlign:'center', color:'#7A8FA8', fontSize:'13px' }}>
                  {selectedHoliday ? selectedHoliday.name+' — Çalışma yok' : 'Bu gün için çalışma yok'}
                </div>
              ) : selectedItems.map((item,i) => {
                const isDone = item.status==='completed'
                return (
                  <div key={item.id} style={{ padding:'13px 16px', borderBottom:i<selectedItems.length-1?'1px solid #F0F4F9':'none', display:'flex', alignItems:'center', gap:'12px', background:isDone?'#F8FFF8':'#fff' }}>
                    <div style={{ width:'42px', height:'42px', borderRadius:'10px', background:isDone?'#EAF4EE':'#EEF3FB', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      {isDone ? <span style={{ fontSize:'18px', color:'#2E7D52' }}>✓</span> : <><div style={{ fontSize:'12px', fontWeight:800, color:'#1B3A6B' }}>{item.duration_minutes}</div><div style={{ fontSize:'8px', color:'#7A8FA8' }}>dk</div></>}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:'13px', fontWeight:700, color:isDone?'#7A8FA8':'#1B3A6B', textDecoration:isDone?'line-through':'none', marginBottom:'2px' }}>{item.title}</div>
                      <div style={{ fontSize:'11px', color:'#7A8FA8' }}>{item.subjects?.name}{item.topics?.name?' — '+item.topics.name:''}{item.question_count>0?' · '+item.question_count+' soru':''}</div>
                      {isDone&&item.is_suspicious&&item.teacher_approved===null && <div style={{ fontSize:'10px', color:'#B45309', marginTop:'2px' }}>⏳ Öğretmen onayı bekleniyor</div>}
                      {isDone&&item.teacher_approved===true && <div style={{ fontSize:'10px', color:'#2E7D52', marginTop:'2px' }}>✓ Öğretmen onayladı</div>}
                      {isDone&&item.teacher_approved===false && <div style={{ fontSize:'10px', color:'#C0392B', marginTop:'2px' }}>✗ Öğretmen reddetti</div>}
                    </div>
                    {isDone ? (
                      <div style={{ textAlign:'center' }}>
                        <div style={{ fontSize:'18px', fontWeight:800, color:'#2E7D52' }}>{item.score}</div>
                        <div style={{ fontSize:'9px', color:'#7A8FA8' }}>puan</div>
                      </div>
                    ) : selectedDate===todayStr ? (
                      <button onClick={() => startCalendarItem(item.id)} style={{ padding:'8px 12px', borderRadius:'20px', background:'#1B3A6B', color:'#fff', fontSize:'12px', fontWeight:700, border:'none', cursor:'pointer', whiteSpace:'nowrap' }}>Yaptım!</button>
                    ) : (
                      <span style={{ fontSize:'11px', padding:'4px 10px', borderRadius:'20px', background:'#F0F4F9', color:'#7A8FA8' }}>Bekliyor</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── PERFORMANS ── */}
        {activeTab === 'performance' && (
          <div>
            <div style={{ fontSize:'16px', fontWeight:700, color:'#1B3A6B', marginBottom:'14px' }}>📊 Konu Performansım</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px', marginBottom:'14px' }}>
              {[
                { label:'Genel', value:'%'+overallRate, color:overallRate>=70?'#2E7D52':overallRate>=50?'#B45309':'#C0392B', bg:overallRate>=70?'#EAF4EE':overallRate>=50?'#FDF4E7':'#FEF2F2' },
                { label:'Güçlü', value:strongTopics.length, color:'#2E7D52', bg:'#EAF4EE' },
                { label:'Zayıf', value:weakTopics.length, color:'#C0392B', bg:'#FEF2F2' },
              ].map(m => (
                <div key={m.label} style={{ background:m.bg, borderRadius:'12px', padding:'14px', textAlign:'center' }}>
                  <div style={{ fontSize:'22px', fontWeight:800, color:m.color }}>{m.value}</div>
                  <div style={{ fontSize:'10px', color:'#7A8FA8', marginTop:'3px' }}>{m.label}</div>
                </div>
              ))}
            </div>
            {topicPerf.length===0 ? (
              <div style={{ background:'#F8FAFF', borderRadius:'12px', padding:'32px', textAlign:'center', color:'#7A8FA8' }}>Henüz veri yok</div>
            ) : topicPerf.map(t => {
              const color = t.accuracy_rate>=70?'#2E7D52':t.accuracy_rate>=50?'#B45309':'#C0392B'
              return (
                <div key={t.id} style={{ background:'#fff', borderRadius:'12px', padding:'12px 14px', marginBottom:'8px', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
                    <div>
                      <div style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B' }}>{t.topics?.name??'Genel'}</div>
                      <div style={{ fontSize:'11px', color:'#7A8FA8' }}>{t.subjects?.name}</div>
                    </div>
                    <span style={{ fontSize:'18px', fontWeight:800, color }}>%{Math.round(t.accuracy_rate)}</span>
                  </div>
                  <div style={{ height:'6px', background:'#F0F4F9', borderRadius:'3px', overflow:'hidden' }}>
                    <div style={{ height:'100%', width:Math.min(t.accuracy_rate,100)+'%', background:color, borderRadius:'3px' }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── ÖDEVLER ── */}
        {activeTab === 'homework' && (
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
              <div style={{ fontSize:'16px', fontWeight:700, color:'#1B3A6B' }}>📚 Ödevlerim</div>
              <div style={{ display:'flex', gap:'5px' }}>
                <span style={{ fontSize:'11px', padding:'3px 10px', borderRadius:'20px', background:'#FDF4E7', color:'#B45309', fontWeight:600 }}>{pendingHw} bekliyor</span>
                <span style={{ fontSize:'11px', padding:'3px 10px', borderRadius:'20px', background:'#EAF4EE', color:'#2E7D52', fontWeight:600 }}>{homework.filter(h=>h.status==='completed').length} tamam</span>
              </div>
            </div>
            {homework.length===0 ? (
              <div style={{ background:'#F8FAFF', borderRadius:'12px', padding:'32px', textAlign:'center', color:'#7A8FA8' }}>Henüz ödev yok</div>
            ) : homework.map(h => {
              const isDone = h.status==='completed'
              const isLate = !isDone&&h.deadline&&new Date(h.deadline)<new Date()
              return (
                <a key={h.id} href={`/homework/${h.id}`} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'13px', marginBottom:'8px', borderRadius:'14px', textDecoration:'none', background:'#fff', border:'1px solid', borderColor:isDone?'#D1FAE5':isLate?'#FECACA':'#E2EAF8' }}>
                  <div style={{ width:'44px', height:'44px', borderRadius:'12px', background:isDone?'#EAF4EE':isLate?'#FEF2F2':'#EEF3FB', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', flexShrink:0 }}>
                    {isDone?'✅':isLate?'⏰':'📝'}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B', textDecoration:isDone?'line-through':'none', marginBottom:'2px' }}>{h.tests?.name}</div>
                    <div style={{ fontSize:'11px', color:'#7A8FA8' }}>{h.tests?.chapters?.books?.name}</div>
                  </div>
                  <span style={{ fontSize:'11px', fontWeight:700, padding:'4px 10px', borderRadius:'20px', background:isDone?'#EAF4EE':isLate?'#FEF2F2':'#FDF4E7', color:isDone?'#2E7D52':isLate?'#C0392B':'#B45309' }}>
                    {isDone?'Tamam':isLate?'Gecikti!':'Yap →'}
                  </span>
                </a>
              )
            })}
            </div>
          )}

        {/* ── HEDEFLER ── */}
        {activeTab === 'goals' && (
          <div>
            <div style={{ fontSize:'16px', fontWeight:700, color:'#1B3A6B', marginBottom:'14px' }}>🎯 Hedeflerim</div>
            {goals.length===0 ? (
              <div style={{ background:'#F8FAFF', border:'1px solid #D5DFF0', borderRadius:'14px', padding:'32px', textAlign:'center' }}>
                <div style={{ fontSize:'32px', marginBottom:'10px' }}>🎯</div>
                <div style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B' }}>Henüz hedef belirlenmedi</div>
              </div>
            ) : goals.map(g => {
              const progress = g.target_score>0?Math.min(Math.round((g.current_score/g.target_score)*100),100):0
              const pColor = progress>=80?'#2E7D52':progress>=50?'#B45309':'#1B3A6B'
              return (
                <div key={g.id} style={{ background:'#fff', borderRadius:'14px', padding:'18px', marginBottom:'10px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'14px' }}>
                    <div>
                      <div style={{ fontSize:'18px', fontWeight:800, color:'#1B3A6B' }}>{g.target_exam}</div>
                      <div style={{ fontSize:'11px', color:'#7A8FA8' }}>{g.target_date?new Date(g.target_date).toLocaleDateString('tr-TR'):'—'}</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:'24px', fontWeight:800, color:'#1B3A6B' }}>{g.target_score}</div>
                      <div style={{ fontSize:'10px', color:'#7A8FA8' }}>hedef puan</div>
                    </div>
                  </div>
                  <div style={{ height:'10px', background:'#F0F4F9', borderRadius:'5px', overflow:'hidden', marginBottom:'8px' }}>
                    <div style={{ height:'100%', width:progress+'%', background:pColor, borderRadius:'5px' }} />
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:'11px', color:'#7A8FA8' }}>
                    <span>Mevcut: {g.current_score}</span>
                    <span style={{ fontWeight:700, color:pColor }}>%{progress}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── AI COACH ── */}
{activeTab === 'coach' && (
  <div>
    <div style={{ fontSize:'16px', fontWeight:700, color:'#1B3A6B', marginBottom:'14px' }}>
      🤖 AI Akademik Koç
    </div>

    {/* Sohbet alanı */}
    <div style={{ background:'#fff', borderRadius:'16px', overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', marginBottom:'12px' }}>
      <div style={{ padding:'12px 16px', borderBottom:'1px solid #F0F4F9', background:'linear-gradient(135deg, #1B3A6B 0%, #2563EB 100%)', display:'flex', alignItems:'center', gap:'10px' }}>
        <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>🤖</div>
        <div>
          <div style={{ fontSize:'13px', fontWeight:700, color:'#fff' }}>AI Koçun</div>
          <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.7)' }}>Kişiselleştirilmiş akademik destek</div>
        </div>
        {coachLoading && (
          <div style={{ marginLeft:'auto', fontSize:'11px', color:'rgba(255,255,255,0.7)' }}>yazıyor...</div>
        )}
      </div>

      {/* Mesajlar */}
      <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:'12px', minHeight:'300px', maxHeight:'400px', overflowY:'auto' }}>
        {coachMessages.map((msg, i) => (
          <div key={i} style={{ display:'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {msg.role === 'ai' && (
              <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:'#EEF3FB', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', flexShrink:0, marginRight:'8px', alignSelf:'flex-end' }}>🤖</div>
            )}
            <div style={{
              maxWidth:'80%', padding:'10px 14px', borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: msg.role === 'user' ? '#1B3A6B' : '#F8FAFC',
              color: msg.role === 'user' ? '#fff' : '#1E293B',
              fontSize:'13px', lineHeight:1.6, border: msg.role === 'ai' ? '1px solid #E2E8F0' : 'none',
              whiteSpace:'pre-wrap',
            }}>
              {msg.text}
            </div>
            {msg.role === 'user' && (
              <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:'#1B3A6B', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:700, color:'#fff', flexShrink:0, marginLeft:'8px', alignSelf:'flex-end' }}>
                {profile?.full_name?.charAt(0)}
              </div>
            )}
          </div>
        ))}
        {coachLoading && (
          <div style={{ display:'flex', justifyContent:'flex-start' }}>
            <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:'#EEF3FB', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', flexShrink:0, marginRight:'8px' }}>🤖</div>
            <div style={{ padding:'10px 16px', borderRadius:'16px 16px 16px 4px', background:'#F8FAFC', border:'1px solid #E2E8F0' }}>
              <div style={{ display:'flex', gap:'4px' }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#94A3B8', animation:`bounce 1s ease-in-out ${i*0.2}s infinite` }} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ padding:'12px 16px', borderTop:'1px solid #F0F4F9', display:'flex', gap:'8px' }}>
        <input
          value={coachInput}
          onChange={e => setCoachInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendCoachMessage()}
          placeholder="Koçuna bir şey sor... (Enter ile gönder)"
          style={{ flex:1, padding:'10px 14px', borderRadius:'20px', border:'1px solid #E2E8F0', fontSize:'13px', outline:'none', background:'#F8FAFC', color:'#1E293B', fontFamily:'inherit' }}
        />
        <button
          onClick={sendCoachMessage}
          disabled={coachLoading || !coachInput.trim()}
          style={{ width:'40px', height:'40px', borderRadius:'50%', background: coachInput.trim() ? '#1B3A6B' : '#E2E8F0', border:'none', cursor: coachInput.trim() ? 'pointer' : 'default', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'background 0.2s' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>

    {/* Hızlı sorular */}
    <div style={{ fontSize:'12px', color:'#94A3B8', marginBottom:'8px', fontWeight:600 }}>Hızlı sorular:</div>
    <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
      {[
        'Hangi konuya önce çalışmalıyım?',
        'Bu hafta için çalışma planı öner',
        'Motivasyonum düştü, ne yapmalıyım?',
        'Zayıf konularımı nasıl güçlendirebilirim?',
      ].map(q => (
        <button key={q} onClick={() => { setCoachInput(q); }}
          style={{ padding:'10px 14px', borderRadius:'10px', background:'#fff', border:'1px solid #E2E8F0', fontSize:'12px', color:'#1B3A6B', cursor:'pointer', textAlign:'left', fontWeight:500 }}>
          💬 {q}
        </button>
      ))}
    </div>

    <style>{`
      @keyframes bounce {
        0%, 100% { transform: translateY(0); opacity: 0.4; }
        50% { transform: translateY(-4px); opacity: 1; }
      }
    `}</style>
  </div>
)}


        {/* SORU CARKI */}
        {activeTab === 'wheel' && (
          <div>
            <div style={{ fontSize:'16px', fontWeight:700, color:'#1B3A6B', marginBottom:'6px' }}>Soru Carki</div>
            <div style={{ fontSize:'12px', color:'#94A3B8', marginBottom:'14px' }}>Sorulari cevapla, kendini gelistir!</div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px', marginBottom:'14px' }}>
              {[
                { label:'Puan', value:wheelScore, icon:'💎', color:'#6B4FC8', bg:'#F0ECFB' },
                { label:'Seri', value:wheelStreak, icon:'🔥', color:'#B45309', bg:'#FDF4E7' },
                { label:'Hedef '+wheelGoal, value:wheelCorrect+'/'+wheelGoal, icon:'🎯', color:'#2E7D52', bg:'#EAF4EE' },
              ].map(m => (
                <div key={m.label} style={{ background:m.bg, borderRadius:'12px', padding:'12px', textAlign:'center' }}>
                  <div style={{ fontSize:'20px', marginBottom:'4px' }}>{m.icon}</div>
                  <div style={{ fontSize:'18px', fontWeight:800, color:m.color }}>{m.value}</div>
                  <div style={{ fontSize:'10px', color:m.color, opacity:0.7 }}>{m.label}</div>
                </div>
              ))}
            </div>

            <div style={{ background:'#fff', borderRadius:'12px', padding:'10px 14px', marginBottom:'14px', border:'1px solid #E2E8F0' }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'11px', color:'#94A3B8', marginBottom:'6px' }}>
                <span>Gunluk Hedef</span>
                <span style={{ fontWeight:700, color:'#2E7D52' }}>{Math.min(wheelCorrect,wheelGoal)}/{wheelGoal}</span>
              </div>
              <div style={{ height:'8px', background:'#F1F5F9', borderRadius:'4px', overflow:'hidden' }}>
                <div style={{ height:'100%', width:Math.min(wheelCorrect/wheelGoal*100,100)+'%', background:'#10B981', borderRadius:'4px', transition:'width 0.5s' }} />
              </div>
              {wheelTotal > 0 && <div style={{ fontSize:'11px', color:'#94A3B8', marginTop:'5px' }}>{wheelTotal} soru cozuldu · %{Math.round(wheelCorrect/wheelTotal*100)} basari</div>}
            </div>

            {!wheelQuestion && !wheelSpin && (
              <div style={{ background:'#fff', borderRadius:'16px', padding:'32px 20px', textAlign:'center', border:'1px solid #E2E8F0', marginBottom:'14px' }}>
                <div style={{ fontSize:'56px', marginBottom:'14px' }}>🎡</div>
                <div style={{ fontSize:'15px', fontWeight:700, color:'#1B3A6B', marginBottom:'8px' }}>Hazir misin?</div>
                <div style={{ fontSize:'13px', color:'#94A3B8', marginBottom:'20px' }}>Tum konulardan rastgele sorular gelecek</div>
                <button onClick={spinWheel} style={{ padding:'14px 32px', borderRadius:'20px', background:'#1B3A6B', color:'#fff', fontSize:'15px', fontWeight:700, border:'none', cursor:'pointer' }}>
                  Carki Cevir!
                </button>
              </div>
            )}

            {wheelSpin && (
              <div style={{ background:'#fff', borderRadius:'16px', padding:'48px 20px', textAlign:'center', border:'1px solid #E2E8F0', marginBottom:'14px' }}>
                <div style={{ fontSize:'56px', marginBottom:'14px' }}>🎡</div>
                <div style={{ fontSize:'14px', fontWeight:600, color:'#1B3A6B' }}>Soru seciliyor...</div>
              </div>
            )}

            {wheelQuestion && !wheelSpin && (
              <div style={{ background:'#fff', borderRadius:'16px', border:'1px solid #E2E8F0', overflow:'hidden', marginBottom:'14px' }}>
                <div style={{ padding:'10px 16px', background:'#1B3A6B', display:'flex', alignItems:'center', gap:'8px' }}>
                  <div>
                    <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.7)' }}>{wheelQuestion.subjects?.name}</div>
                    <div style={{ fontSize:'12px', fontWeight:700, color:'#fff' }}>{wheelQuestion.topics?.name ?? 'Genel'}</div>
                  </div>
                  <span style={{ marginLeft:'auto', fontSize:'10px', fontWeight:700, padding:'2px 8px', borderRadius:'10px', background:'rgba(255,255,255,0.2)', color:'#fff' }}>
                    {wheelQuestion.difficulty==='easy'?'Kolay':wheelQuestion.difficulty==='hard'?'Zor':'Orta'}
                  </span>
                </div>

                <div style={{ padding:'16px', background:'#F8FAFC', borderBottom:'1px solid #E2E8F0' }}>
                  <div style={{ fontSize:'14px', fontWeight:600, color:'#1B3A6B', lineHeight:1.6 }}>{wheelQuestion.question}</div>
                </div>

                <div style={{ padding:'12px', display:'flex', flexDirection:'column', gap:'8px' }}>
                  {['A','B','C','D'].map(opt => {
                    const text = wheelQuestion['option_'+opt.toLowerCase()]
                    if (!text) return null
                    const isSelected = wheelSelected === opt
                    const isCorrect  = wheelQuestion.correct_answer === opt
                    const isWrong    = isSelected && wheelResult === 'wrong'
                    const showCorrect = wheelResult && isCorrect
                    let bg = '#F8FAFC', border = '#E2E8F0', color = '#1B3A6B'
                    if (showCorrect)  { bg='#DCFCE7'; border='#86EFAC'; color='#14532D' }
                    else if (isWrong) { bg='#FEF2F2'; border='#FECACA'; color='#DC2626' }
                    else if (isSelected) { bg='#EEF3FB'; border='#1B3A6B' }
                    return (
                      <button key={opt} onClick={() => answerWheel(opt)} disabled={!!wheelResult}
                        style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 14px', borderRadius:'10px', border:'2px solid '+border, background:bg, cursor:wheelResult?'default':'pointer', textAlign:'left' }}>
                        <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:showCorrect?'#10B981':isWrong?'#DC2626':'#1B3A6B', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:700, color:'#fff', flexShrink:0 }}>
                          {showCorrect?'V':isWrong?'X':opt}
                        </div>
                        <span style={{ fontSize:'13px', fontWeight:isSelected?700:500, color }}>{text}</span>
                      </button>
                    )
                  })}
                </div>

                {wheelResult && (
                  <div style={{ padding:'12px 16px', borderTop:'1px solid #E2E8F0' }}>
                    {wheelResult === 'correct' ? (
                      <div style={{ background:'#DCFCE7', border:'1px solid #86EFAC', borderRadius:'10px', padding:'12px 14px', display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px' }}>
                        <span style={{ fontSize:'24px' }}>Dogru! +10 puan</span>
                        <div style={{ fontSize:'12px', color:'#14532D', opacity:0.8 }}>
                          {wheelStreak > 1 ? wheelStreak+' ust uste dogru!' : 'Harika is!'}
                        </div>
                      </div>
                    ) : (
                      <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'10px', padding:'12px 14px', marginBottom:'10px' }}>
                        <div style={{ fontSize:'13px', fontWeight:700, color:'#DC2626', marginBottom:wheelExplain?'8px':0 }}>
                          Dogru cevap: {wheelQuestion.correct_answer} — {wheelQuestion['option_'+wheelQuestion.correct_answer.toLowerCase()]}
                        </div>
                        {wheelLoading && <div style={{ fontSize:'12px', color:'#94A3B8' }}>AI aciklama hazirlaniyor...</div>}
                        {wheelExplain && (
                          <div style={{ fontSize:'12px', color:'#374151', lineHeight:1.6, padding:'8px', background:'rgba(255,255,255,0.6)', borderRadius:'8px' }}>{wheelExplain}</div>
                        )}
                      </div>
                    )}
                    <button onClick={spinWheel} style={{ width:'100%', padding:'12px', borderRadius:'10px', background:'#1B3A6B', color:'#fff', fontSize:'13px', fontWeight:700, border:'none', cursor:'pointer' }}>
                      Sonraki Soru
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}


        {/* SINAVLAR */}
        {activeTab === 'exams' && (
          <div>
            <div style={{ fontSize:'16px', fontWeight:700, color:'#1B3A6B', marginBottom:'6px' }}>Sinav Sonuclarim</div>
            <div style={{ fontSize:'12px', color:'#94A3B8', marginBottom:'14px' }}>Tum deneme sinavlari, siralamayi ve ders bazli analizin</div>

            {examResults.length === 0 ? (
              <div style={{ background:'#F8FAFF', border:'1px solid #D5DFF0', borderRadius:'14px', padding:'32px', textAlign:'center' }}>
                <div style={{ fontSize:'32px', marginBottom:'10px' }}>📝</div>
                <div style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B' }}>Henuz sinav sonucu yok</div>
              </div>
            ) : (() => {
              const examGroups = examResults.reduce((acc: any, r: any) => {
                const key = r.exam_id
                if (!acc[key]) acc[key] = { exam: r.exams, subjects: [], totalNet: 0, rank: r.rank_in_exam, percentile: r.percentile }
                acc[key].subjects.push(r)
                acc[key].totalNet += r.net
                return acc
              }, {})
              const examList = Object.values(examGroups).sort((a: any, b: any) => new Date(a.exam?.exam_date).getTime() - new Date(b.exam?.exam_date).getTime()) as any[]
              const allNets = examList.map((e: any) => e.totalNet)
              const avg = (arr: number[]) => arr.length > 0 ? Math.round(arr.reduce((a: number, b: number) => a + b, 0) / arr.length * 10) / 10 : 0
              const sections = ['SAYISAL','SOZEL','DIL','DIN']
              const sectionLabels: Record<string,string> = { SAYISAL:'SAYISAL', SOZEL:'SOZEL', DIL:'DIL', DIN:'DIN' }
              const sectionColors: Record<string,string> = { SAYISAL:'#1B3A6B', SOZEL:'#2E7D52', DIL:'#0F7070', DIN:'#B45309' }
              const sectionBgs: Record<string,string> = { SAYISAL:'#EEF3FB', SOZEL:'#DCFCE7', DIL:'#CCFBF1', DIN:'#FEF3C7' }
              const lastExam = examList[examList.length - 1] as any
              const prevExam = examList[examList.length - 2] as any
              const change = lastExam && prevExam ? lastExam.totalNet - prevExam.totalNet : null

              const subjectAvgs = examResults.reduce((acc: any, r: any) => {
                const name = r.subjects?.name ?? 'Diger'
                const section = (r.subjects?.section ?? 'DIGER').toUpperCase().replace('Ö','O').replace('Ü','U').replace('Ş','S').replace('İ','I').replace('Ç','C').replace('Ğ','G')
                if (!acc[name]) acc[name] = { nets: [], color: r.subjects?.color, section }
                acc[name].nets.push(r.net)
                return acc
              }, {})

              return (
                <div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'8px', marginBottom:'14px' }}>
                    {[
                      { label:'Toplam Sinav', value: examList.length, color:'#1B3A6B', bg:'#EEF3FB' },
                      { label:'Genel Ort.', value: avg(allNets).toFixed(1)+' net', color:'#2E7D52', bg:'#DCFCE7' },
                      { label:'Son Sinav', value: lastExam ? lastExam.totalNet.toFixed(1)+' net' : '-', color:'#B45309', bg:'#FEF3C7' },
                      { label:'Son Sinav Siralama', value: lastExam?.rank ? lastExam.rank+'. sira' : '-', color:'#6B4FC8', bg:'#EDE9FE' },
                    ].map(m => (
                      <div key={m.label} style={{ background:m.bg, borderRadius:'12px', padding:'12px', textAlign:'center' }}>
                        <div style={{ fontSize:'18px', fontWeight:800, color:m.color }}>{m.value}</div>
                        <div style={{ fontSize:'10px', color:m.color, opacity:0.7, marginTop:'3px' }}>{m.label}</div>
                      </div>
                    ))}
                  </div>

                  {examList.map((e: any, i: number) => {
                    const sectionNets: Record<string,number> = {}
                    sections.forEach(sec => { sectionNets[sec] = 0 })
                    e.subjects.forEach((r: any) => {
                      const sec = (r.subjects?.section ?? 'DIGER').toUpperCase().replace('Ö','O').replace('Ü','U').replace('Ş','S').replace('İ','I').replace('Ç','C').replace('Ğ','G')
                      if (sectionNets[sec] !== undefined) sectionNets[sec] += r.net
                    })
                    const prev = i > 0 ? (examList[i-1] as any).totalNet : null
                    const diff = prev !== null ? e.totalNet - prev : null
                    return (
                      <div key={e.exam?.id} style={{ background:'#fff', borderRadius:'14px', border:'1px solid #E2E8F0', padding:'14px', marginBottom:'10px' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'12px' }}>
                          <div>
                            <div style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B' }}>{e.exam?.name}</div>
                            <div style={{ fontSize:'11px', color:'#94A3B8' }}>{e.exam?.exam_date ? new Date(e.exam.exam_date).toLocaleDateString('tr-TR') : '-'}</div>
                          </div>
                          <div style={{ textAlign:'right', display:'flex', gap:'8px', alignItems:'center' }}>
                            {e.rank && (
                              <div style={{ width:'30px', height:'30px', borderRadius:'50%', background:e.rank<=3?['#FFD700','#C0C0C0','#CD7F32'][e.rank-1]:'#EEF3FB', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:800, color:e.rank<=3?'#fff':'#1B3A6B' }}>
                                {e.rank}
                              </div>
                            )}
                            {e.percentile && (
                              <span style={{ fontSize:'10px', fontWeight:700, padding:'2px 8px', borderRadius:'10px', background:e.percentile>=75?'#DCFCE7':e.percentile>=50?'#EEF3FB':'#FEF2F2', color:e.percentile>=75?'#14532D':e.percentile>=50?'#1B3A6B':'#DC2626' }}>
                                %{e.percentile}lik
                              </span>
                            )}
                            <div style={{ textAlign:'center' }}>
                              <div style={{ fontSize:'20px', fontWeight:800, color:'#1B3A6B' }}>{e.totalNet.toFixed(1)}</div>
                              {diff !== null && <div style={{ fontSize:'10px', color:diff>0?'#14532D':diff<0?'#DC2626':'#94A3B8', fontWeight:700 }}>{diff>0?'+':''}{diff.toFixed(1)}</div>}
                            </div>
                          </div>
                        </div>
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'6px' }}>
                          {e.subjects.map((r: any) => (
                            <div key={r.id} style={{ display:'flex', justifyContent:'space-between', padding:'6px 10px', borderRadius:'8px', background:'#F8FAFC' }}>
                              <span style={{ fontSize:'11px', color:'#475569', fontWeight:600 }}>{r.subjects?.name}</span>
                              <span style={{ fontSize:'11px', fontWeight:700, color: r.net >= 8 ? '#14532D' : r.net >= 5 ? '#B45309' : '#DC2626' }}>{r.net.toFixed(1)} net</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}

                  <div style={{ background:'#fff', borderRadius:'14px', border:'1px solid #E2E8F0', padding:'14px', marginTop:'14px' }}>
                    <div style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B', marginBottom:'12px' }}>Ders Bazli Ortalamalarim</div>
                    {Object.entries(subjectAvgs).sort((a: any, b: any) => avg(b[1].nets) - avg(a[1].nets)).map(([name, v]: any) => {
                      const subAvg = avg(v.nets)
                      const isStrong = subAvg >= 8
                      const isWeak = subAvg < 4
                      return (
                        <div key={name} style={{ marginBottom:'10px' }}>
                          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                              <span style={{ fontSize:'12px', color:'#475569', fontWeight:600 }}>{name}</span>
                              {isStrong && <span style={{ fontSize:'9px', fontWeight:700, padding:'1px 6px', borderRadius:'8px', background:'#DCFCE7', color:'#14532D' }}>GUCLU</span>}
                              {isWeak && <span style={{ fontSize:'9px', fontWeight:700, padding:'1px 6px', borderRadius:'8px', background:'#FEF2F2', color:'#DC2626' }}>GELISTIR</span>}
                            </div>
                            <span style={{ fontSize:'13px', fontWeight:800, color:isStrong?'#14532D':isWeak?'#DC2626':'#B45309' }}>{subAvg.toFixed(1)}</span>
                          </div>
                          <div style={{ height:'6px', background:'#F1F5F9', borderRadius:'3px', overflow:'hidden' }}>
                            <div style={{ height:'100%', width:Math.min(subAvg/20*100, 100)+'%', background:isStrong?'#10B981':isWeak?'#DC2626':'#D97706', borderRadius:'3px' }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {/* ── SWOT ── */}
        {activeTab === 'swot' && (
          <div>
            <div style={{ fontSize:'16px', fontWeight:700, color:'#1B3A6B', marginBottom:'14px' }}>🔍 SWOT Analizim</div>
            {topicPerf.length===0 ? (
              <div style={{ background:'#FDF4E7', border:'1px solid #FED7AA', borderRadius:'14px', padding:'32px', textAlign:'center' }}>
                <div style={{ fontSize:'13px', fontWeight:700, color:'#B45309' }}>Yeterli veri yok</div>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                {[
                  { title:'💪 Güçlü Yönlerim', items:strongTopics, color:'#2E7D52', bg:'#EAF4EE', border:'#D1FAE5', empty:'Henüz güçlü konu yok' },
                  { title:'📈 Gelişim Alanlarım', items:weakTopics, color:'#C0392B', bg:'#FEF2F2', border:'#FEE2E2', empty:'Kritik zayıflık yok!' },
                  { title:'🎯 Fırsatlarım', items:midTopics, color:'#B45309', bg:'#FDF4E7', border:'#FEF3C7', empty:'Orta seviye konu yok' },
                ].map(box => (
                  <div key={box.title} style={{ background:box.bg, border:'1px solid '+box.border, borderRadius:'14px', padding:'14px' }}>
                    <div style={{ fontSize:'13px', fontWeight:700, color:box.color, marginBottom:'10px' }}>{box.title}</div>
                    {box.items.length===0 ? (
                      <div style={{ fontSize:'12px', color:'#7A8FA8' }}>{box.empty}</div>
                    ) : box.items.slice(0,4).map(t => (
                      <div key={t.id} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid rgba(0,0,0,0.05)', fontSize:'12px' }}>
                        <span style={{ color:'#374151' }}>{t.subjects?.name} — {t.topics?.name??'Genel'}</span>
                        <strong style={{ color:box.color }}>%{Math.round(t.accuracy_rate)}</strong>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

</div>
      <AccessibilityWidget />
    </div>
  )
}