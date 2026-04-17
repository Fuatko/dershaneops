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
  const [menuOpen, setMenuOpen] = useState(false)
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
    const today = new Date().toISOString().slice(0, 10)
    if (streak) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
      const newStreak = streak.last_active_date === today ? streak.current_streak : (streak.last_active_date === yesterday ? streak.current_streak + 1 : 1)
      await supabase.from('student_streaks').update({ current_streak: newStreak, longest_streak: Math.max(newStreak, streak.longest_streak ?? 0), last_active_date: today, total_points: (streak.total_points ?? 0) + score, daily_score: Math.min((streak.daily_score ?? 0) + score, 100), updated_at: new Date().toISOString() }).eq('student_id', profile.id)
    } else {
      await supabase.from('student_streaks').insert({ student_id: profile.id, current_streak: 1, longest_streak: 1, last_active_date: today, total_points: score, daily_score: score })
    }
    const remaining = dailyTasks.filter(t => t.status === 'pending' && t.id !== taskId).length
    if (remaining === 0) { setCelebrationMsg('Tüm görevleri tamamladın! 🎉'); setCelebration(true); setTimeout(() => setCelebration(false), 4000) }
    else if (score >= 95) { setCelebrationMsg('Mükemmel! ' + score + ' puan! ⭐'); setCelebration(true); setTimeout(() => setCelebration(false), 2500) }
    await load()
  }

  async function signOut() { await supabase.auth.signOut(); window.location.href = '/login' }

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
  const DAYS = ['', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

  function getDailyScoreFeedback(score: number) {
    if (score >= 96) return { msg: 'Muhteşem! Sen bir yıldızsın!', color: '#B45309', bg: '#FDF4E7', emoji: '🌟' }
    if (score >= 76) return { msg: 'Harika gidiyorsun!', color: '#2E7D52', bg: '#EAF4EE', emoji: '⭐' }
    if (score >= 50) return { msg: 'İyi iş, devam et!', color: '#1B3A6B', bg: '#EEF3FB', emoji: '💪' }
    return { msg: 'Bugün daha fazlasını yapabilirsin!', color: '#7A8FA8', bg: '#F0F4F9', emoji: '🎯' }
  }
  const fb = getDailyScoreFeedback(dailyScore)

  const TABS = [
    { id: 'today', label: '📅 Bugün', icon: '📅' },
    { id: 'performance', label: '📊 Performans', icon: '📊' },
    { id: 'homework', label: '📚 Ödevler', icon: '📚' },
    { id: 'plan', label: '🗓 Plan', icon: '🗓' },
    { id: 'goals', label: '🎯 Hedefler', icon: '🎯' },
    { id: 'swot', label: '🔍 SWOT', icon: '🔍' },
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

      {/* Kutlama */}
      {celebration && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, pointerEvents: 'none', background: 'rgba(0,0,0,0.3)' }}>
          <div style={{ background: '#1B3A6B', borderRadius: '20px', padding: '28px 40px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
            <div style={{ fontSize: '52px', marginBottom: '10px' }}>🎉</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#fff' }}>{celebrationMsg}</div>
          </div>
        </div>
      )}

      {/* Mobil Header */}
      <div style={{ background: '#1B3A6B', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 800, color: '#fff' }}>D</div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>DershaneOPS</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>{profile?.full_name?.split(' ')[0]}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {streak && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.1)', padding: '5px 10px', borderRadius: '20px' }}>
              <span style={{ fontSize: '14px' }}>🔥</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>{streak.current_streak}</span>
            </div>
          )}
          <button onClick={signOut} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', padding: '6px 10px', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>
            Çıkış
          </button>
        </div>
      </div>

      {/* Günlük Skor Bar */}
      {streak && (
        <div style={{ background: '#fff', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #F0F4F9' }}>
          <div style={{ flex: 1, height: '6px', background: '#F0F4F9', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: dailyScore + '%', background: dailyScore >= 75 ? '#2E7D52' : dailyScore >= 50 ? '#B45309' : '#1B3A6B', borderRadius: '3px', transition: 'width 0.5s' }} />
          </div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#1B3A6B', flexShrink: 0 }}>{dailyScore}/100 puan</span>
          <span style={{ fontSize: '13px' }}>{fb.emoji}</span>
        </div>
      )}

      {/* Alt Tab Bar (mobil navigasyon) */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #E2EAF8', display: 'flex', zIndex: 100, paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {TABS.slice(0, 5).map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flex: 1, padding: '8px 4px 10px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
            <span style={{ fontSize: '18px' }}>{tab.icon}</span>
            <span style={{ fontSize: '9px', fontWeight: activeTab === tab.id ? 700 : 500, color: activeTab === tab.id ? '#1B3A6B' : '#9CA3AF' }}>
              {tab.label.split(' ')[1]}
            </span>
            {activeTab === tab.id && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#1B3A6B' }} />}
          </button>
        ))}
        <button onClick={() => setActiveTab('swot')} style={{ flex: 1, padding: '8px 4px 10px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
          <span style={{ fontSize: '18px' }}>🔍</span>
          <span style={{ fontSize: '9px', fontWeight: activeTab === 'swot' ? 700 : 500, color: activeTab === 'swot' ? '#1B3A6B' : '#9CA3AF' }}>SWOT</span>
          {activeTab === 'swot' && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#1B3A6B' }} />}
        </button>
      </div>

      {/* İçerik — alt tab bar için padding */}
      <div style={{ padding: '16px 16px 80px' }}>

        {/* BUGÜN */}
        {activeTab === 'today' && (
          <div>
            {/* Karşılama Kartı */}
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

            {/* Seri & Puan & Rozet */}
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

            {/* Feedback */}
            {streak && (
              <div style={{ background: fb.bg, borderRadius: '12px', padding: '12px 14px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>{fb.emoji}</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: fb.color }}>{fb.msg}</div>
                  <div style={{ fontSize: '11px', color: '#7A8FA8' }}>Günlük skor: {dailyScore}/100</div>
                </div>
              </div>
            )}

            {/* Günlük Görevler */}
            <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', marginBottom: '14px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #F0F4F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#1B3A6B' }}>📋 Bugünün Görevleri</div>
                <span style={{ fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: completedTasks === totalTasks && totalTasks > 0 ? '#EAF4EE' : '#EEF3FB', color: completedTasks === totalTasks && totalTasks > 0 ? '#2E7D52' : '#1B3A6B' }}>
                  {completedTasks}/{totalTasks}
                </span>
              </div>
              {dailyTasks.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎉</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#2E7D52' }}>Bugün için görev yok!</div>
                  <div style={{ fontSize: '11px', color: '#7A8FA8', marginTop: '4px' }}>Öğretmenin yakında görev atayacak.</div>
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
                      <div style={{ fontSize: '11px', color: '#7A8FA8' }}>{task.description ?? task.question_count + ' soru'} • {task.target_duration_minutes} dk</div>
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

            {/* Bekleyen Ödevler */}
            {pendingHw > 0 && (
              <div onClick={() => setActiveTab('homework')} style={{ background: '#FDF4E7', borderRadius: '12px', padding: '14px 16px', border: '1px solid #FED7AA', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', marginBottom: '14px' }}>
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

            {/* Rozetler */}
            {badges.length > 0 && (
              <div style={{ background: '#fff', borderRadius: '14px', padding: '14px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '10px' }}>🏅 Rozetlerim</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {badges.map(b => (
                    <div key={b.id} style={{ background: '#F8FAFF', borderRadius: '10px', padding: '8px 12px', textAlign: 'center', border: '1px solid #E2EAF8' }}>
                      <div style={{ fontSize: '22px', marginBottom: '2px' }}>{b.badges?.icon}</div>
                      <div style={{ fontSize: '10px', fontWeight: 600, color: '#1B3A6B' }}>{b.badges?.name}</div>
                    </div>
                  ))}
                </div>
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
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {topicPerf.map(t => {
                  const color = t.accuracy_rate >= 70 ? '#2E7D52' : t.accuracy_rate >= 50 ? '#B45309' : '#C0392B'
                  const bg = t.accuracy_rate >= 70 ? '#EAF4EE' : t.accuracy_rate >= 50 ? '#FDF4E7' : '#FEF2F2'
                  return (
                    <div key={t.id} style={{ background: '#fff', borderRadius: '12px', padding: '12px 14px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B' }}>{t.topics?.name ?? 'Genel'}</div>
                          <div style={{ fontSize: '11px', color: '#7A8FA8' }}>{t.subjects?.name}</div>
                        </div>
                        <span style={{ fontSize: '18px', fontWeight: 800, color }}> %{Math.round(t.accuracy_rate)}</span>
                      </div>
                      <div style={{ height: '6px', background: '#F0F4F9', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: Math.min(t.accuracy_rate, 100) + '%', background: color, borderRadius: '3px' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ÖDEVLERİM */}
        {activeTab === 'homework' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#1B3A6B' }}>📚 Ödevlerim</div>
              <div style={{ display: 'flex', gap: '6px' }}>
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
                <a key={h.id} href={`/homework/${h.id}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', marginBottom: '8px', borderRadius: '14px', textDecoration: 'none', background: '#fff', border: '1px solid', borderColor: isDone ? '#D1FAE5' : isLate ? '#FECACA' : '#E2EAF8', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: isDone ? '#EAF4EE' : isLate ? '#FEF2F2' : '#EEF3FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                    {isDone ? '✅' : isLate ? '⏰' : '📝'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '2px', textDecoration: isDone ? 'line-through' : 'none' }}>{h.tests?.name}</div>
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

        {/* PLAN */}
        {activeTab === 'plan' && (
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#1B3A6B', marginBottom: '14px' }}>🗓 Haftalık Planım</div>
            {!studyPlan ? (
              <div style={{ background: '#FDF4E7', border: '1px solid #FED7AA', borderRadius: '14px', padding: '32px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>📅</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#B45309' }}>Henüz çalışma planın yok</div>
                <div style={{ fontSize: '11px', color: '#7A8FA8', marginTop: '4px' }}>Öğretmeninden plan oluşturmasını iste</div>
              </div>
            ) : (
              <div>
                <div style={{ background: '#EEF3FB', borderRadius: '10px', padding: '10px 14px', marginBottom: '12px', fontSize: '12px', color: '#1B3A6B', fontWeight: 600 }}>
                  {new Date(studyPlan.week_start_date).toLocaleDateString('tr-TR')} — {new Date(studyPlan.week_end_date).toLocaleDateString('tr-TR')}
                </div>
                {[1,2,3,4,5,6,7].map(day => {
                  const dayItems = studyPlan.study_plan_items?.filter((i: any) => i.day_of_week === day) ?? []
                  if (dayItems.length === 0) return null
                  return (
                    <div key={day} style={{ background: '#fff', borderRadius: '12px', marginBottom: '10px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                      <div style={{ padding: '10px 14px', background: '#F8FAFF', borderBottom: '1px solid #F0F4F9', fontSize: '12px', fontWeight: 700, color: '#1B3A6B', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{DAYS[day]}</span>
                        <span style={{ color: '#7A8FA8', fontWeight: 400 }}>{dayItems.reduce((s: number, i: any) => s + i.target_duration_minutes, 0)} dk</span>
                      </div>
                      {dayItems.map((item: any, ti: number) => (
                        <div key={item.id} style={{ padding: '10px 14px', borderBottom: ti < dayItems.length - 1 ? '1px solid #F0F4F9' : 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.task_type === 'weak_area' ? '#C0392B' : '#1B3A6B', flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#1B3A6B' }}>{item.subjects?.name} — {item.topics?.name}</div>
                          </div>
                          <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '8px', background: '#F0F4F9', color: '#4A6080' }}>{item.question_count}s</span>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#1B3A6B' }}>{g.target_exam}</div>
                      <div style={{ fontSize: '11px', color: '#7A8FA8', marginTop: '2px' }}>{g.target_date ? new Date(g.target_date).toLocaleDateString('tr-TR') : '—'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '24px', fontWeight: 800, color: '#1B3A6B' }}>{g.target_score}</div>
                      <div style={{ fontSize: '10px', color: '#7A8FA8' }}>hedef puan</div>
                    </div>
                  </div>
                  <div style={{ height: '10px', background: '#F0F4F9', borderRadius: '5px', overflow: 'hidden', marginBottom: '8px' }}>
                    <div style={{ height: '100%', width: progress + '%', background: pColor, borderRadius: '5px', transition: 'width 0.5s' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#7A8FA8' }}>
                    <span>Mevcut: <strong style={{ color: '#1B3A6B' }}>{g.current_score}</strong></span>
                    <span style={{ fontWeight: 700, color: pColor }}>%{progress} tamamlandı</span>
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
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>📊</div>
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
                <div style={{ background: '#EEF3FB', border: '1px solid #BFDBFE', borderRadius: '14px', padding: '14px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A6B', marginBottom: '6px' }}>⚠️ Dikkat Etmem Gerekenler</div>
                  {riskScore >= 45 ? (
                    <div style={{ fontSize: '12px', color: '#1B3A6B', lineHeight: 1.6 }}>
                      Risk skorum: <strong style={{ color: riskScore >= 70 ? '#C0392B' : '#B45309' }}>{Math.round(riskScore)}/100</strong>
                      <br />• Düzenli çalışma alışkanlığı kazan
                      <br />• Öğretmeninden destek iste
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: '#2E7D52', fontWeight: 600 }}>Harika gidiyorsun! Risk düşük. Böyle devam et!</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}