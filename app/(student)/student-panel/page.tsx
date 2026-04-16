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
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('today')
  const [celebration, setCelebration] = useState(false)
  const [celebrationMsg, setCelebrationMsg] = useState('')
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    const { data: p } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()
    if (!p) { setLoading(false); return }
    setProfile(p)

    const [{ data: tp }, { data: hw }, { data: sp }, { data: risk }, { data: st }, { data: sb }, { data: dt }, { data: g }] = await Promise.all([
      supabase.from('student_topic_performance').select('*, topics(name), subjects(name, color)').eq('student_id', p.id).order('accuracy_rate', { ascending: true }),
      supabase.from('homework_assignments').select('*, tests(name, chapters(name, books(name)))').eq('student_id', p.id).order('created_at', { ascending: false }),
      supabase.from('study_plans').select('*, study_plan_items(*, subjects(name), topics(name))').eq('student_id', p.id).eq('status', 'active').order('created_at', { ascending: false }).limit(1).single(),
      supabase.rpc('calculate_risk_score', { p_student_id: p.id }),
      supabase.from('student_streaks').select('*').eq('student_id', p.id).single(),
      supabase.from('student_badges').select('*, badges(*)').eq('student_id', p.id),
      supabase.from('daily_tasks').select('*, subjects(name, color), topics(name)').eq('student_id', p.id).eq('task_date', new Date().toISOString().slice(0, 10)).order('status'),
      supabase.from('student_goals').select('*').eq('student_id', p.id).eq('status', 'active'),
    ])

    setTopicPerf(tp ?? [])
    setHomework(hw ?? [])
    setStudyPlan(sp)
    setRiskScore(risk ?? 0)
    setStreak(st)
    setBadges(sb ?? [])
    setDailyTasks(dt ?? [])
    setGoals(g ?? [])
    setLoading(false)
  }

  async function completeTask(taskId: string) {
    const task = dailyTasks.find(t => t.id === taskId)
    if (!task) return

    const score = Math.floor(Math.random() * 20) + 80
    await supabase.from('daily_tasks').update({ status: 'completed', completed_at: new Date().toISOString(), score }).eq('id', taskId)

    // Streak güncelle
    const today = new Date().toISOString().slice(0, 10)
    const existing = streak
    if (existing) {
      const lastActive = existing.last_active_date
      const newStreak = lastActive === today ? existing.current_streak : (lastActive === new Date(Date.now() - 86400000).toISOString().slice(0, 10) ? existing.current_streak + 1 : 1)
      const newPoints = (existing.total_points ?? 0) + score
      const newDailyScore = Math.min((existing.daily_score ?? 0) + score, 100)
      await supabase.from('student_streaks').update({ current_streak: newStreak, longest_streak: Math.max(newStreak, existing.longest_streak ?? 0), last_active_date: today, total_points: newPoints, daily_score: newDailyScore, updated_at: new Date().toISOString() }).eq('student_id', profile.id)
    } else {
      await supabase.from('student_streaks').insert({ student_id: profile.id, current_streak: 1, longest_streak: 1, last_active_date: today, total_points: score, daily_score: score })
    }

    // Kutlama
    const remaining = dailyTasks.filter(t => t.status === 'pending' && t.id !== taskId).length
    if (remaining === 0) {
      setCelebrationMsg('Tüm görevleri tamamladın! 🎉')
      setCelebration(true)
      setTimeout(() => setCelebration(false), 4000)
    } else if (score >= 95) {
      setCelebrationMsg('Mükemmel! ' + score + ' puan! ⭐')
      setCelebration(true)
      setTimeout(() => setCelebration(false), 2500)
    }
// Event tetikle
const rateAfter = dailyScore >= 95 ? 'high_performance' : 'task_completed'
await fetch('/api/events', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    student_id: profile.id,
    event_type: rateAfter,
    event_data: {
      student_name: profile.full_name,
      message: rateAfter === 'high_performance'
        ? profile.full_name + ' bugün ' + dailyScore + ' puan aldı! Harika performans.'
        : profile.full_name + ' görevini tamamladı: ' + (task.subjects?.name ?? 'Görev'),
    }
  })
})
    await load()
  }

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const totalQ = topicPerf.reduce((s, t) => s + t.total_questions, 0)
  const totalC = topicPerf.reduce((s, t) => s + t.correct_count, 0)
  const overallRate = totalQ > 0 ? Math.round(totalC / totalQ * 100) : 0
  const pendingHw = homework.filter(h => h.status !== 'completed').length
  const completedTasks = dailyTasks.filter(t => t.status === 'completed').length
  const totalTasks = dailyTasks.length
  const dailyProgress = totalTasks > 0 ? Math.round(completedTasks / totalTasks * 100) : 0
  const weakTopics = topicPerf.filter(t => t.accuracy_rate < 50)
  const strongTopics = topicPerf.filter(t => t.accuracy_rate >= 70)
  const dailyScore = streak?.daily_score ?? 0
  const DAYS = ['', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

  function getDailyScoreFeedback(score: number) {
    if (score >= 96) return { msg: 'Muhteşem! Sen bir yıldızsın!', color: '#B45309', bg: '#FDF4E7', emoji: '🌟' }
    if (score >= 76) return { msg: 'Harika gidiyorsun!', color: '#2E7D52', bg: '#EAF4EE', emoji: '⭐' }
    if (score >= 50) return { msg: 'İyi iş, devam et!', color: '#1B3A6B', bg: '#EEF3FB', emoji: '💪' }
    return { msg: 'Bugün daha fazlasını yapabilirsin!', color: '#7A8FA8', bg: '#F0F4F9', emoji: '🎯' }
  }

  const fb = getDailyScoreFeedback(dailyScore)

  const TABS = [
    { id: 'today', label: '📅 Bugün' },
    { id: 'performance', label: '📊 Performans' },
    { id: 'homework', label: '📚 Ödevler' },
    { id: 'plan', label: '🗓 Plan' },
    { id: 'goals', label: '🎯 Hedefler' },
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
    <div style={{ display: 'flex', height: '100vh', background: '#F0F4F9', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>

      {/* Kutlama Overlay */}
      {celebration && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, pointerEvents: 'none' }}>
          <div style={{ background: '#1B3A6B', borderRadius: '20px', padding: '28px 40px', textAlign: 'center', boxShadow: '0 20px 60px rgba(27,58,107,0.4)', animation: 'pulse 0.5s ease' }}>
            <div style={{ fontSize: '52px', marginBottom: '10px' }}>🎉</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff' }}>{celebrationMsg}</div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside style={{ width: '200px', background: '#fff', borderRight: '1px solid #D5DFF0', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #D5DFF0', background: '#1B3A6B' }}>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>DershaneOPS</div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>Öğrenci Paneli</div>
        </div>

        {profile && (
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #D5DFF0', background: '#F8FAFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#1B3A6B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {profile.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#1B3A6B' }}>{profile.full_name?.split(' ')[0]}</div>
                {streak && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <span style={{ fontSize: '13px' }}>🔥</span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#B45309' }}>{streak.current_streak} gün</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Günlük Skor */}
        {streak && (
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #D5DFF0' }}>
            <div style={{ fontSize: '10px', color: '#7A8FA8', fontWeight: 600, marginBottom: '6px' }}>GÜNLÜK SKOR</div>
            <div style={{ height: '8px', background: '#F0F4F9', borderRadius: '4px', overflow: 'hidden', marginBottom: '5px' }}>
              <div style={{ height: '100%', width: dailyScore + '%', background: dailyScore >= 75 ? '#2E7D52' : dailyScore >= 50 ? '#B45309' : '#1B3A6B', borderRadius: '4px', transition: 'width 0.5s ease' }} />
            </div>
            <div style={{ fontSize: '11px', color: '#4A6080', fontWeight: 600 }}>{dailyScore}/100 puan</div>
          </div>
        )}

        <nav style={{ flex: 1, padding: '8px', overflowY: 'auto' }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: '10px', marginBottom: '3px', fontSize: '13px', fontWeight: activeTab === tab.id ? 700 : 500, color: activeTab === tab.id ? '#fff' : '#4A6080', background: activeTab === tab.id ? '#1B3A6B' : 'transparent', border: 'none', cursor: 'pointer' }}>
              {tab.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: '8px', borderTop: '1px solid #D5DFF0' }}>
          <button onClick={signOut} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', color: '#C0392B', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
            Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>

        {/* BUGÜN */}
        {activeTab === 'today' && (
          <div style={{ maxWidth: '700px' }}>
            {/* Karşılama */}
            <div style={{ background: '#1B3A6B', borderRadius: '16px', padding: '20px 24px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
                  Merhaba, {profile?.full_name?.split(' ')[0]}! 👋
                </div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
                  {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '36px', fontWeight: 800, color: '#fff' }}>{dailyProgress}%</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>Bugün</div>
              </div>
            </div>

            {/* Streak & Rozet Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '16px' }}>
              {[
                { label: 'Seri', value: (streak?.current_streak ?? 0) + ' gün', icon: '🔥', color: '#B45309', bg: '#FDF4E7' },
                { label: 'Toplam Puan', value: streak?.total_points ?? 0, icon: '💎', color: '#6B4FC8', bg: '#F0ECFB' },
                { label: 'Rozet', value: badges.length, icon: '🏅', color: '#2E7D52', bg: '#EAF4EE' },
              ].map(m => (
                <div key={m.label} style={{ background: m.bg, borderRadius: '12px', padding: '14px', textAlign: 'center', border: '1px solid rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}>{m.icon}</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: m.color }}>{m.value}</div>
                  <div style={{ fontSize: '10.5px', color: '#7A8FA8' }}>{m.label}</div>
                </div>
              ))}
            </div>

            {/* Feedback mesajı */}
            {streak && (
              <div style={{ background: fb.bg, borderRadius: '12px', padding: '14px 18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
                <span style={{ fontSize: '28px' }}>{fb.emoji}</span>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: fb.color }}>{fb.msg}</div>
                  <div style={{ fontSize: '12px', color: '#7A8FA8' }}>Günlük skor: {dailyScore}/100</div>
                </div>
              </div>
            )}

            {/* Günlük Görevler */}
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #D5DFF0', overflow: 'hidden', marginBottom: '16px' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #F0F4F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#1B3A6B' }}>📋 Bugünün Görevleri</div>
                <span style={{ fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '20px', background: completedTasks === totalTasks && totalTasks > 0 ? '#EAF4EE' : '#EEF3FB', color: completedTasks === totalTasks && totalTasks > 0 ? '#2E7D52' : '#1B3A6B' }}>
                  {completedTasks}/{totalTasks}
                </span>
              </div>

              {dailyTasks.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <div style={{ fontSize: '36px', marginBottom: '12px' }}>🎉</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#2E7D52', marginBottom: '6px' }}>Bugün için görev yok!</div>
                  <div style={{ fontSize: '12px', color: '#7A8FA8' }}>Öğretmenin yakında görev atayacak.</div>
                </div>
              ) : dailyTasks.map((task, i) => {
                const isDone = task.status === 'completed'
                return (
                  <div key={task.id} style={{ padding: '16px 20px', borderBottom: i < dailyTasks.length - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', alignItems: 'center', gap: '14px', background: isDone ? '#F8FFF8' : '#fff', opacity: isDone ? 0.7 : 1 }}>
                    <button
                      onClick={() => !isDone && completeTask(task.id)}
                      style={{ width: '44px', height: '44px', borderRadius: '50%', background: isDone ? '#2E7D52' : '#EEF3FB', border: isDone ? 'none' : '2px solid #D5DFF0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isDone ? 'default' : 'pointer', flexShrink: 0, fontSize: '20px', transition: 'all 0.2s' }}
                    >
                      {isDone ? '✓' : task.subjects?.name?.[0] ?? '📖'}
                    </button>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: isDone ? '#7A8FA8' : '#1B3A6B', textDecoration: isDone ? 'line-through' : 'none', marginBottom: '3px' }}>
                        {task.subjects?.name ?? 'Genel'}{task.topics?.name ? ' — ' + task.topics.name : ''}
                      </div>
                      <div style={{ fontSize: '12px', color: '#7A8FA8' }}>
                        {task.description ?? task.question_count + ' soru'} • {task.target_duration_minutes} dk
                      </div>
                    </div>
                    {isDone ? (
                      <div style={{ textAlign: 'center', flexShrink: 0 }}>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: '#2E7D52' }}>{task.score}</div>
                        <div style={{ fontSize: '10px', color: '#7A8FA8' }}>puan</div>
                      </div>
                    ) : (
                      <div style={{ padding: '8px 16px', borderRadius: '20px', background: '#1B3A6B', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
                        onClick={() => completeTask(task.id)}>
                        Yaptım!
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Bekleyen Ödevler */}
            {pendingHw > 0 && (
              <div style={{ background: '#FDF4E7', borderRadius: '12px', padding: '14px 18px', border: '1px solid #FED7AA', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setActiveTab('homework')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '22px' }}>📝</span>
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#B45309' }}>{pendingHw} bekleyen ödev var</div>
                    <div style={{ fontSize: '11.5px', color: '#7A8FA8' }}>Görmek için tıkla</div>
                  </div>
                </div>
                <span style={{ fontSize: '18px', color: '#B45309' }}>→</span>
              </div>
            )}

            {/* Rozetler */}
            {badges.length > 0 && (
              <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #D5DFF0', padding: '16px 20px', marginTop: '14px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#1B3A6B', marginBottom: '12px' }}>🏅 Rozetlerim</div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {badges.map(b => (
                    <div key={b.id} style={{ background: '#F8FAFF', borderRadius: '10px', padding: '10px 14px', textAlign: 'center', border: '1px solid #E2EAF8' }}>
                      <div style={{ fontSize: '24px', marginBottom: '4px' }}>{b.badges?.icon}</div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: '#1B3A6B' }}>{b.badges?.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PERFORMANS */}
        {activeTab === 'performance' && (
          <div style={{ maxWidth: '700px' }}>
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', marginBottom: '20px' }}>Konu Performansım</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '20px' }}>
              {[
                { label: 'Genel Başarı', value: '%' + overallRate, color: overallRate >= 70 ? '#2E7D52' : overallRate >= 50 ? '#B45309' : '#C0392B', bg: overallRate >= 70 ? '#EAF4EE' : overallRate >= 50 ? '#FDF4E7' : '#FEF2F2' },
                { label: 'Güçlü Konu', value: strongTopics.length, color: '#2E7D52', bg: '#EAF4EE' },
                { label: 'Zayıf Konu', value: weakTopics.length, color: '#C0392B', bg: '#FEF2F2' },
              ].map(m => (
                <div key={m.label} style={{ background: m.bg, borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: m.color }}>{m.value}</div>
                  <div style={{ fontSize: '11px', color: '#7A8FA8', marginTop: '4px' }}>{m.label}</div>
                </div>
              ))}
            </div>
            {topicPerf.length === 0 ? (
              <div style={{ background: '#F8FAFF', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '40px', textAlign: 'center', color: '#7A8FA8' }}>Henüz veri yok</div>
            ) : (
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {topicPerf.map(t => {
                  const color = t.accuracy_rate >= 70 ? '#2E7D52' : t.accuracy_rate >= 50 ? '#B45309' : '#C0392B'
                  const bg = t.accuracy_rate >= 70 ? '#EAF4EE' : t.accuracy_rate >= 50 ? '#FDF4E7' : '#FEF2F2'
                  return (
                    <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px', background: bg }}>
                      <div style={{ width: '120px', flexShrink: 0 }}>
                        <div style={{ fontSize: '12.5px', fontWeight: 700, color }}>{t.topics?.name ?? 'Genel'}</div>
                        <div style={{ fontSize: '10.5px', color: '#7A8FA8' }}>{t.subjects?.name}</div>
                      </div>
                      <div style={{ flex: 1, height: '8px', background: 'rgba(0,0,0,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: Math.min(t.accuracy_rate, 100) + '%', background: color, borderRadius: '4px' }} />
                      </div>
                      <span style={{ fontSize: '15px', fontWeight: 800, color, width: '44px', textAlign: 'right', flexShrink: 0 }}>
                        %{Math.round(t.accuracy_rate)}
                        {t.trend_direction === 'up' && <span style={{ fontSize: '10px' }}> ↑</span>}
                        {t.trend_direction === 'down' && <span style={{ fontSize: '10px' }}> ↓</span>}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ÖDEVLERİM */}
        {activeTab === 'homework' && (
          <div style={{ maxWidth: '700px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', margin: 0 }}>Ödevlerim</h1>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '20px', background: '#FDF4E7', color: '#B45309', fontWeight: 600 }}>Bekleyen: {pendingHw}</span>
                <span style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '20px', background: '#EAF4EE', color: '#2E7D52', fontWeight: 600 }}>Tamam: {homework.filter(h => h.status === 'completed').length}</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {homework.length === 0 ? (
                <div style={{ background: '#F8FAFF', borderRadius: '12px', border: '1px solid #D5DFF0', padding: '40px', textAlign: 'center', color: '#7A8FA8' }}>Henüz ödev yok</div>
              ) : homework.map(h => {
                const isDone = h.status === 'completed'
                const isLate = !isDone && h.deadline && new Date(h.deadline) < new Date()
                return (
                  <a key={h.id} href={`/homework/${h.id}`} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px', borderRadius: '14px', textDecoration: 'none', background: '#fff', border: '1px solid', borderColor: isDone ? '#D1FAE5' : isLate ? '#FECACA' : '#D5DFF0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: isDone ? '#EAF4EE' : isLate ? '#FEF2F2' : '#EEF3FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                      {isDone ? '✅' : isLate ? '⏰' : '📝'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#1B3A6B', textDecoration: isDone ? 'line-through' : 'none' }}>{h.tests?.name}</div>
                      <div style={{ fontSize: '12px', color: '#7A8FA8', marginTop: '2px' }}>{h.tests?.chapters?.books?.name}</div>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 700, padding: '5px 12px', borderRadius: '20px', background: isDone ? '#EAF4EE' : isLate ? '#FEF2F2' : '#FDF4E7', color: isDone ? '#2E7D52' : isLate ? '#C0392B' : '#B45309', flexShrink: 0 }}>
                      {isDone ? 'Tamam' : isLate ? 'Gecikti!' : 'Yap'}
                    </span>
                  </a>
                )
              })}
            </div>
          </div>
        )}

        {/* ÇALIŞMA PLANI */}
        {activeTab === 'plan' && (
          <div style={{ maxWidth: '700px' }}>
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', marginBottom: '20px' }}>Haftalık Planım</h1>
            {!studyPlan ? (
              <div style={{ background: '#FDF4E7', border: '1px solid #FED7AA', borderRadius: '14px', padding: '40px', textAlign: 'center' }}>
                <div style={{ fontSize: '36px', marginBottom: '12px' }}>📅</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#B45309' }}>Henüz çalışma planın yok</div>
                <div style={{ fontSize: '12px', color: '#7A8FA8', marginTop: '6px' }}>Öğretmeninden plan oluşturmasını iste</div>
              </div>
            ) : (
              <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #D5DFF0', overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #D5DFF0', fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>
                  {new Date(studyPlan.week_start_date).toLocaleDateString('tr-TR')} — {new Date(studyPlan.week_end_date).toLocaleDateString('tr-TR')}
                </div>
                {[1,2,3,4,5,6,7].map(day => {
                  const dayItems = studyPlan.study_plan_items?.filter((i: any) => i.day_of_week === day) ?? []
                  if (dayItems.length === 0) return null
                  return (
                    <div key={day} style={{ borderBottom: '1px solid #F0F4F9' }}>
                      <div style={{ padding: '10px 18px', background: '#F8FAFF', fontSize: '12px', fontWeight: 700, color: '#1B3A6B', borderBottom: '1px solid #F0F4F9' }}>
                        {DAYS[day]}
                        <span style={{ marginLeft: '8px', fontSize: '11px', color: '#7A8FA8', fontWeight: 400 }}>
                          {dayItems.reduce((s: number, i: any) => s + i.target_duration_minutes, 0)} dk
                        </span>
                      </div>
                      {dayItems.map((item: any, ti: number) => (
                        <div key={item.id} style={{ padding: '12px 18px', borderBottom: ti < dayItems.length - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.task_type === 'weak_area' ? '#C0392B' : item.task_type === 'review' ? '#B45309' : '#1B3A6B', flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#1B3A6B' }}>{item.subjects?.name} — {item.topics?.name}</div>
                            <div style={{ fontSize: '12px', color: '#4A6080' }}>{item.task_description}</div>
                          </div>
                          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '8px', background: '#F0F4F9', color: '#4A6080' }}>{item.question_count}s</span>
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '8px', background: '#F0F4F9', color: '#4A6080' }}>{item.target_duration_minutes}dk</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* HEDEFLER */}
        {activeTab === 'goals' && (
          <div style={{ maxWidth: '700px' }}>
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1B3A6B', marginBottom: '20px' }}>Hedeflerim 🎯</h1>
            {goals.length === 0 ? (
              <div style={{ background: '#F8FAFF', border: '1px solid #D5DFF0', borderRadius: '14px', padding: '40px', textAlign: 'center' }}>
                <div style={{ fontSize: '36px', marginBottom: '12px' }}>🎯</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#1B3A6B', marginBottom: '6px' }}>Henüz hedef belirlenmedi</div>
                <div style={{ fontSize: '12px', color: '#7A8FA8' }}>Öğretmenin senin için hedef belirleyecek</div>
              </div>
            ) : goals.map(g => {
              const progress = g.target_score > 0 ? Math.min(Math.round((g.current_score / g.target_score) * 100), 100) : 0
              return (
                <div key={g.id} style={{ background: '#fff', borderRadius: '14px', border: '1px solid #D5DFF0', padding: '20px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#1B3A6B' }}>{g.target_exam}</div>
                      <div style={{ fontSize: '12px', color: '#7A8FA8' }}>Hedef: {g.target_date ? new Date(g.target_date).toLocaleDateString('tr-TR') : '—'}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '28px', fontWeight: 800, color: '#1B3A6B' }}>{g.target_score}</div>
                      <div style={{ fontSize: '10px', color: '#7A8FA8' }}>hedef puan</div>
                    </div>
                  </div>
                  <div style={{ height: '10px', background: '#F0F4F9', borderRadius: '5px', overflow: 'hidden', marginBottom: '8px' }}>
                    <div style={{ height: '100%', width: progress + '%', background: progress >= 80 ? '#2E7D52' : progress >= 50 ? '#B45309' : '#1B3A6B', borderRadius: '5px', transition: 'width 0.5s ease' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#7A8FA8' }}>
                    <span>Mevcut: {g.current_score}</span>
                    <span>%{progress} tamamlandı</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}