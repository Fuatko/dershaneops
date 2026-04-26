'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AccessibilityWidget from '@/components/AccessibilityWidget'

export default function ParentPanelPage() {
  const [profile, setProfile]       = useState<any>(null)
  const [children, setChildren]     = useState<any[]>([])
  const [selected, setSelected]     = useState<any>(null)
  const [topicPerf, setTopicPerf]   = useState<any[]>([])
  const [homework, setHomework]     = useState<any[]>([])
  const [goals, setGoals]           = useState<any[]>([])
  const [streak, setStreak]         = useState<any>(null)
  const [calendar, setCalendar]     = useState<any[]>([])
  const [calNotes, setCalNotes]     = useState<any[]>([])
  const [riskScore, setRiskScore]   = useState<number>(0)
  const [aiReport, setAiReport]     = useState('')
  const [examResults, setExamResults] = useState<any[]>([])
  const [aiLoading, setAiLoading]   = useState(false)
  const [loading, setLoading]       = useState(true)
  const [activeTab, setActiveTab]   = useState('summary')
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    const { data: p } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()
    if (!p) { setLoading(false); return }
    setProfile(p)

    // Velinin çocuklarını bul
    const { data: matches } = await supabase
      .from('parent_students')
      .select('student_id, profiles!parent_students_student_id_fkey(id, full_name, grade_level, classroom_id)')
      .eq('parent_id', p.id)

    const kids = (matches ?? []).map((m: any) => m.profiles).filter(Boolean)

    // Classroom adlarını ekle
    const { data: classrooms } = await supabase.from('classrooms').select('id, name')
    const classMap: Record<string,string> = {}
    for (const c of classrooms ?? []) classMap[c.id] = c.name
    const kidsWithClass = kids.map((k: any) => ({ ...k, classroom_name: k.classroom_id ? classMap[k.classroom_id] : null }))

    setChildren(kidsWithClass)
    if (kidsWithClass.length > 0) await selectChild(kidsWithClass[0])
    setLoading(false)
  }

  async function selectChild(child: any) {
    setSelected(child)
    setAiReport('')
    const [
      { data: tp }, { data: hw }, { data: g },
      { data: st }, { data: cal }, { data: notes },
      { data: risk }, { data: exRes }
    ] = await Promise.all([
      supabase.from('student_topic_performance').select('*, topics(name), subjects(name)').eq('student_id', child.id).order('accuracy_rate', { ascending: true }),
      supabase.from('homework_assignments').select('*, tests(name, chapters(name, books(name)))').eq('student_id', child.id).order('created_at', { ascending: false }),
      supabase.from('student_goals').select('*').eq('student_id', child.id).eq('status', 'active'),
      supabase.from('student_streaks').select('*').eq('student_id', child.id).single(),
      supabase.from('study_calendar').select('*, subjects(name)').eq('student_id', child.id).order('calendar_date', { ascending: false }).limit(30),
      supabase.from('calendar_notes').select('*, profiles!calendar_notes_teacher_id_fkey(full_name)').eq('student_id', child.id).order('calendar_date', { ascending: false }).limit(10),
      supabase.rpc('calculate_risk_score', { p_student_id: child.id }),
      supabase.from('exam_results').select('*, exams(id, name, exam_date, exam_type), subjects(id, name, color, section)').eq('student_id', child.id).order('created_at', { ascending: true }),
    ])
    setTopicPerf(tp ?? [])
    setHomework(hw ?? [])
    setGoals(g ?? [])
    setStreak(st)
    setCalendar(cal ?? [])
    setCalNotes(notes ?? [])
    setRiskScore(Math.round(risk ?? 0))
    setExamResults(exRes ?? [])
  }

  async function getAiReport() {
    if (!selected) return
    setAiLoading(true); setAiReport('')
    const totalQ = topicPerf.reduce((s,t)=>s+t.total_questions, 0)
    const totalC = topicPerf.reduce((s,t)=>s+t.correct_count, 0)
    const overallRate = totalQ>0 ? Math.round(totalC/totalQ*100) : 0
    const weakTopics = topicPerf.filter(t=>t.accuracy_rate<50).map(t=>t.subjects?.name+' - '+t.topics?.name).join(', ')
    const strongTopics = topicPerf.filter(t=>t.accuracy_rate>=70).map(t=>t.topics?.name).join(', ')
    const hwDone = homework.filter(h=>h.status==='completed').length
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'parentreport',
          student_name: selected.full_name,
          overall_rate: overallRate,
          weak_topics: weakTopics || 'Yok',
          strong_topics: strongTopics || 'Yok',
          streak: streak?.current_streak ?? 0,
          homework_done: hwDone,
          homework_total: homework.length,
        }),
      })
      const d = await res.json()
      setAiReport(d.report ?? '')
    } catch { setAiReport('AI raporu alınamadı.') }
    setAiLoading(false)
  }

  async function signOut() { await supabase.auth.signOut(); window.location.href = '/login' }

  const totalQ    = topicPerf.reduce((s,t)=>s+t.total_questions, 0)
  const totalC    = topicPerf.reduce((s,t)=>s+t.correct_count, 0)
  const overallRate = totalQ>0 ? Math.round(totalC/totalQ*100) : 0
  const pendingHw = homework.filter(h=>h.status!=='completed').length
  const weakTopics   = topicPerf.filter(t=>t.accuracy_rate<50)
  const strongTopics = topicPerf.filter(t=>t.accuracy_rate>=70)
  const riskColor = riskScore>=70?'#DC2626':riskScore>=45?'#D97706':riskScore>=20?'#1B3A6B':'#10B981'
  const riskBg    = riskScore>=70?'#FEF2F2':riskScore>=45?'#FEF3C7':riskScore>=20?'#EEF3FB':'#DCFCE7'
  const riskLabel = riskScore>=70?'Kritik':riskScore>=45?'Yüksek':riskScore>=20?'Orta':'Düşük'

  const TABS = [
    { id:'summary',     label:'Özet',       icon:'📊' },
    { id:'performance', label:'Başarı',      icon:'📈' },
    { id:'homework',    label:'Ödevler',     icon:'📚' },
    { id:'calendar',    label:'Takvim',      icon:'🗓' },
    { id:'goals',       label:'Hedefler',    icon:'🎯' },
    { id:'exams',       label:'Sinavlar',    icon:'📝' },
    { id:'report',      label:'AI Rapor',    icon:'🤖' },
  ]

  if (loading) return (
    <div style={{ display:'flex', height:'100vh', alignItems:'center', justifyContent:'center', background:'#F0F4F9' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:'40px', marginBottom:'12px' }}>👨‍👩‍👧</div>
        <div style={{ fontSize:'14px', color:'#7A8FA8' }}>Yükleniyor...</div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#F0F4F9', fontFamily:'-apple-system, BlinkMacSystemFont, sans-serif' }}>

      {/* Header */}
      <div style={{ background:'#1B3A6B', padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px' }}>👨‍👩‍👧</div>
          <div>
            <div style={{ fontSize:'13px', fontWeight:700, color:'#fff' }}>DershaneOPS</div>
            <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.6)' }}>Veli Paneli</div>
          </div>
        </div>
        <button onClick={signOut} style={{ background:'rgba(255,255,255,0.1)', border:'none', borderRadius:'8px', padding:'6px 10px', color:'#fff', fontSize:'12px', cursor:'pointer' }}>Çıkış</button>
      </div>

      {/* Çocuk seçici */}
      {children.length > 1 && (
        <div style={{ background:'#fff', padding:'10px 16px', borderBottom:'1px solid #E2EAF8', display:'flex', gap:'8px', overflowX:'auto' }}>
          {children.map(child => (
            <button key={child.id} onClick={() => selectChild(child)}
              style={{ flexShrink:0, padding:'7px 14px', borderRadius:'20px', border:'1.5px solid', borderColor:selected?.id===child.id?'#1B3A6B':'#E2EAF8', background:selected?.id===child.id?'#1B3A6B':'#fff', color:selected?.id===child.id?'#fff':'#475569', fontSize:'12px', fontWeight:600, cursor:'pointer' }}>
              {child.full_name?.split(' ')[0]}
            </button>
          ))}
        </div>
      )}

      {/* Alt Tab Bar */}
      <div style={{ position:'fixed', bottom:0, left:0, right:0, background:'#fff', borderTop:'1px solid #E2EAF8', display:'flex', zIndex:100, paddingBottom:'env(safe-area-inset-bottom)', overflowX:'auto' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ flex:'0 0 auto', minWidth:'52px', padding:'8px 4px 10px', border:'none', background:'transparent', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:'2px' }}>
            <span style={{ fontSize:'18px' }}>{tab.icon}</span>
            <span style={{ fontSize:'9px', fontWeight:activeTab===tab.id?700:500, color:activeTab===tab.id?'#1B3A6B':'#9CA3AF' }}>{tab.label}</span>
            {activeTab===tab.id && <div style={{ width:'4px', height:'4px', borderRadius:'50%', background:'#1B3A6B' }} />}
          </button>
        ))}
      </div>

      <div style={{ padding:'16px 16px 80px' }}>

        {!selected ? (
          <div style={{ background:'#fff', borderRadius:'14px', padding:'40px', textAlign:'center', border:'1px solid #E2EAF8' }}>
            <div style={{ fontSize:'32px', marginBottom:'10px' }}>👨‍👩‍👧</div>
            <div style={{ fontSize:'14px', color:'#7A8FA8' }}>Henüz çocuk eşleştirmesi yapılmamış</div>
            <div style={{ fontSize:'12px', color:'#94A3B8', marginTop:'6px' }}>Yönetici ile iletişime geçin</div>
          </div>
        ) : (
          <>

            {/* ÖZET */}
            {activeTab === 'summary' && (
              <div>
                {/* Öğrenci kart */}
                <div style={{ background:'linear-gradient(135deg, #1B3A6B 0%, #2563EB 100%)', borderRadius:'16px', padding:'18px', marginBottom:'14px', color:'#fff' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'14px' }}>
                    <div style={{ width:'48px', height:'48px', borderRadius:'50%', background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', fontWeight:800, flexShrink:0 }}>
                      {selected.full_name?.split(' ').map((n:string)=>n[0]).join('').slice(0,2)}
                    </div>
                    <div>
                      <div style={{ fontSize:'17px', fontWeight:800 }}>{selected.full_name}</div>
                      <div style={{ fontSize:'12px', opacity:0.7 }}>{selected.grade_level}. Sınıf {selected.classroom_name ? '· '+selected.classroom_name : ''}</div>
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'8px' }}>
                    {[
                      { label:'Başarı',  value:'%'+overallRate },
                      { label:'Seri',    value:(streak?.current_streak??0)+' gün' },
                      { label:'Ödev',    value:pendingHw+' bekl.' },
                      { label:'Risk',    value:riskLabel },
                    ].map(m => (
                      <div key={m.label} style={{ background:'rgba(255,255,255,0.15)', borderRadius:'10px', padding:'8px', textAlign:'center' }}>
                        <div style={{ fontSize:'14px', fontWeight:800 }}>{m.value}</div>
                        <div style={{ fontSize:'9px', opacity:0.7, marginTop:'2px' }}>{m.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Risk kartı */}
                <div style={{ background:riskBg, borderRadius:'12px', padding:'14px 16px', marginBottom:'12px', border:'1px solid '+riskColor+'30', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div>
                    <div style={{ fontSize:'12px', fontWeight:600, color:riskColor, marginBottom:'3px' }}>Akademik Risk Durumu</div>
                    <div style={{ fontSize:'24px', fontWeight:800, color:riskColor }}>{riskScore} <span style={{ fontSize:'14px' }}>/ 100</span></div>
                  </div>
                  <span style={{ fontSize:'13px', fontWeight:700, padding:'6px 16px', borderRadius:'20px', background:riskColor, color:'#fff' }}>{riskLabel}</span>
                </div>

                {/* Zayıf konular */}
                {weakTopics.length > 0 && (
                  <div style={{ background:'#FEF2F2', borderRadius:'12px', padding:'14px', marginBottom:'12px', border:'1px solid #FECACA' }}>
                    <div style={{ fontSize:'13px', fontWeight:700, color:'#DC2626', marginBottom:'10px' }}>⚠️ Dikkat Gerektiren Konular</div>
                    {weakTopics.slice(0,4).map((t,i) => (
                      <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid #FEE2E2', fontSize:'12px' }}>
                        <span style={{ color:'#374151' }}>{t.subjects?.name} — {t.topics?.name ?? 'Genel'}</span>
                        <strong style={{ color:'#DC2626' }}>%{Math.round(t.accuracy_rate)}</strong>
                      </div>
                    ))}
                  </div>
                )}

                {/* Güçlü konular */}
                {strongTopics.length > 0 && (
                  <div style={{ background:'#DCFCE7', borderRadius:'12px', padding:'14px', marginBottom:'12px', border:'1px solid #86EFAC' }}>
                    <div style={{ fontSize:'13px', fontWeight:700, color:'#14532D', marginBottom:'10px' }}>💪 Güçlü Konular</div>
                    {strongTopics.slice(0,4).map((t,i) => (
                      <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid #BBF7D0', fontSize:'12px' }}>
                        <span style={{ color:'#374151' }}>{t.subjects?.name} — {t.topics?.name ?? 'Genel'}</span>
                        <strong style={{ color:'#14532D' }}>%{Math.round(t.accuracy_rate)}</strong>
                      </div>
                    ))}
                  </div>
                )}

                {/* Son öğretmen notları */}
                {calNotes.length > 0 && (
                  <div style={{ background:'#EEF3FB', borderRadius:'12px', padding:'14px', border:'1px solid #BFDBFE' }}>
                    <div style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B', marginBottom:'10px' }}>👨‍🏫 Son Öğretmen Notları</div>
                    {calNotes.slice(0,3).map((n,i) => (
                      <div key={i} style={{ padding:'8px 0', borderBottom: i<Math.min(calNotes.length,3)-1?'1px solid #DBEAFE':'none' }}>
                        <div style={{ fontSize:'11px', color:'#64748B', marginBottom:'3px' }}>{n.calendar_date} · {n.profiles?.full_name}</div>
                        <div style={{ fontSize:'12.5px', color:'#1E293B', lineHeight:1.5 }}>{n.note}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* BAŞARI */}
            {activeTab === 'performance' && (
              <div>
                <div style={{ fontSize:'16px', fontWeight:700, color:'#1B3A6B', marginBottom:'14px' }}>📈 Akademik Başarı</div>

                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px', marginBottom:'14px' }}>
                  {[
                    { label:'Genel', value:'%'+overallRate, color:overallRate>=70?'#14532D':overallRate>=50?'#78350F':'#7F1D1D', bg:overallRate>=70?'#DCFCE7':overallRate>=50?'#FEF3C7':'#FEF2F2' },
                    { label:'Güçlü', value:strongTopics.length+' konu', color:'#14532D', bg:'#DCFCE7' },
                    { label:'Zayıf', value:weakTopics.length+' konu', color:'#7F1D1D', bg:'#FEF2F2' },
                  ].map(m => (
                    <div key={m.label} style={{ background:m.bg, borderRadius:'12px', padding:'14px', textAlign:'center' }}>
                      <div style={{ fontSize:'18px', fontWeight:800, color:m.color }}>{m.value}</div>
                      <div style={{ fontSize:'10px', color:'#7A8FA8', marginTop:'3px' }}>{m.label}</div>
                    </div>
                  ))}
                </div>

                {topicPerf.length === 0 ? (
                  <div style={{ background:'#F8FAFC', borderRadius:'12px', padding:'32px', textAlign:'center', color:'#94A3B8' }}>Henüz veri yok</div>
                ) : topicPerf.map(t => {
                  const color = t.accuracy_rate>=70?'#14532D':t.accuracy_rate>=50?'#78350F':'#7F1D1D'
                  return (
                    <div key={t.id} style={{ background:'#fff', borderRadius:'12px', padding:'12px 14px', marginBottom:'8px', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
                        <div>
                          <div style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B' }}>{t.topics?.name ?? 'Genel'}</div>
                          <div style={{ fontSize:'11px', color:'#94A3B8' }}>{t.subjects?.name}</div>
                        </div>
                        <span style={{ fontSize:'18px', fontWeight:800, color }}>%{Math.round(t.accuracy_rate)}</span>
                      </div>
                      <div style={{ height:'6px', background:'#F1F5F9', borderRadius:'3px', overflow:'hidden' }}>
                        <div style={{ height:'100%', width:Math.min(t.accuracy_rate,100)+'%', background:color, borderRadius:'3px' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* ÖDEVLER */}
            {activeTab === 'homework' && (
              <div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
                  <div style={{ fontSize:'16px', fontWeight:700, color:'#1B3A6B' }}>📚 Ödevler</div>
                  <div style={{ display:'flex', gap:'5px' }}>
                    <span style={{ fontSize:'11px', padding:'3px 10px', borderRadius:'20px', background:'#FEF3C7', color:'#78350F', fontWeight:600 }}>{pendingHw} bekliyor</span>
                    <span style={{ fontSize:'11px', padding:'3px 10px', borderRadius:'20px', background:'#DCFCE7', color:'#14532D', fontWeight:600 }}>{homework.filter(h=>h.status==='completed').length} tamam</span>
                  </div>
                </div>
                {homework.length === 0 ? (
                  <div style={{ background:'#F8FAFC', borderRadius:'12px', padding:'32px', textAlign:'center', color:'#94A3B8' }}>Ödev yok</div>
                ) : homework.map(h => {
                  const isDone = h.status === 'completed'
                  const isLate = !isDone && h.deadline && new Date(h.deadline) < new Date()
                  return (
                    <div key={h.id} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'13px', marginBottom:'8px', borderRadius:'14px', background:'#fff', border:'1px solid', borderColor:isDone?'#BBF7D0':isLate?'#FECACA':'#E2E8F0' }}>
                      <div style={{ width:'44px', height:'44px', borderRadius:'12px', background:isDone?'#DCFCE7':isLate?'#FEF2F2':'#EEF3FB', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', flexShrink:0 }}>
                        {isDone?'✅':isLate?'⏰':'📝'}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B', marginBottom:'2px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{h.tests?.name}</div>
                        <div style={{ fontSize:'11px', color:'#94A3B8' }}>{h.tests?.chapters?.books?.name ?? '—'}</div>
                        {h.deadline && (
                          <div style={{ fontSize:'10px', color:isLate?'#DC2626':'#94A3B8', marginTop:'2px' }}>
                            Son teslim: {new Date(h.deadline).toLocaleDateString('tr-TR')} {isLate?'— Gecikti!':''}
                          </div>
                        )}
                      </div>
                      <span style={{ fontSize:'11px', fontWeight:700, padding:'4px 10px', borderRadius:'20px', background:isDone?'#DCFCE7':isLate?'#FEF2F2':'#FEF3C7', color:isDone?'#14532D':isLate?'#DC2626':'#78350F', flexShrink:0 }}>
                        {isDone ? 'Tamam' : isLate ? 'Gecikti' : 'Bekliyor'}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* TAKVİM */}
            {activeTab === 'calendar' && (
              <div>
                <div style={{ fontSize:'16px', fontWeight:700, color:'#1B3A6B', marginBottom:'14px' }}>🗓 Çalışma Takvimi</div>
                {calendar.length === 0 ? (
                  <div style={{ background:'#F8FAFC', borderRadius:'12px', padding:'32px', textAlign:'center', color:'#94A3B8' }}>Takvim verisi yok</div>
                ) : calendar.map((item, i) => {
                  const isDone = item.status === 'completed'
                  return (
                    <div key={item.id} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 14px', marginBottom:'8px', borderRadius:'12px', background:'#fff', border:'1px solid', borderColor:isDone?'#BBF7D0':'#E2E8F0' }}>
                      <div style={{ width:'40px', height:'40px', borderRadius:'10px', background:isDone?'#DCFCE7':'#EEF3FB', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <div style={{ fontSize:'13px', fontWeight:800, color:isDone?'#14532D':'#1B3A6B' }}>
                          {new Date(item.calendar_date+'T12:00:00').getDate()}
                        </div>
                        <div style={{ fontSize:'8px', color:'#94A3B8' }}>
                          {new Date(item.calendar_date+'T12:00:00').toLocaleDateString('tr-TR', { month:'short' })}
                        </div>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:'13px', fontWeight:700, color:isDone?'#94A3B8':'#1B3A6B', textDecoration:isDone?'line-through':'none', marginBottom:'2px' }}>{item.title}</div>
                        <div style={{ fontSize:'11px', color:'#94A3B8' }}>{item.subjects?.name ?? ''} · {item.duration_minutes} dk</div>
                      </div>
                      <span style={{ fontSize:'11px', fontWeight:700, padding:'3px 10px', borderRadius:'10px', background:isDone?'#DCFCE7':'#FEF3C7', color:isDone?'#14532D':'#78350F', flexShrink:0 }}>
                        {isDone ? '✓ Tamam' : 'Bekliyor'}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* HEDEFLER */}
            {activeTab === 'goals' && (
              <div>
                <div style={{ fontSize:'16px', fontWeight:700, color:'#1B3A6B', marginBottom:'14px' }}>🎯 Hedefler</div>
                {goals.length === 0 ? (
                  <div style={{ background:'#F8FAFC', borderRadius:'12px', padding:'32px', textAlign:'center', color:'#94A3B8' }}>
                    <div style={{ fontSize:'24px', marginBottom:'8px' }}>🎯</div>
                    Henüz hedef belirlenmemiş
                  </div>
                ) : goals.map(g => {
                  const progress = g.target_score > 0 ? Math.min(Math.round((g.current_score/g.target_score)*100), 100) : 0
                  const pColor = progress>=80?'#14532D':progress>=50?'#78350F':'#1B3A6B'
                  return (
                    <div key={g.id} style={{ background:'#fff', borderRadius:'14px', padding:'16px', marginBottom:'10px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'12px' }}>
                        <div>
                          <div style={{ fontSize:'18px', fontWeight:800, color:'#1B3A6B' }}>{g.target_exam}</div>
                          <div style={{ fontSize:'11px', color:'#94A3B8' }}>{g.target_date ? new Date(g.target_date).toLocaleDateString('tr-TR') : '—'}</div>
                        </div>
                        <div style={{ textAlign:'right' }}>
                          <div style={{ fontSize:'22px', fontWeight:800, color:'#1B3A6B' }}>{g.target_score}</div>
                          <div style={{ fontSize:'10px', color:'#94A3B8' }}>hedef puan</div>
                        </div>
                      </div>
                      <div style={{ height:'8px', background:'#F1F5F9', borderRadius:'4px', overflow:'hidden', marginBottom:'6px' }}>
                        <div style={{ height:'100%', width:progress+'%', background:pColor, borderRadius:'4px' }} />
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:'11px', color:'#94A3B8' }}>
                        <span>Mevcut: {g.current_score}</span>
                        <span style={{ fontWeight:700, color:pColor }}>%{progress}</span>
                      </div>
                      {g.notes && <div style={{ fontSize:'12px', color:'#475569', marginTop:'8px', padding:'8px', background:'#F8FAFC', borderRadius:'6px' }}>{g.notes}</div>}
                    </div>
                  )
                })}
              </div>
            )}


            {/* SINAVLAR */}
            {activeTab === 'exams' && (
              <div>
                <div style={{ fontSize:'16px', fontWeight:700, color:'#1B3A6B', marginBottom:'6px' }}>Sinav Sonuclari</div>
                <div style={{ fontSize:'12px', color:'#94A3B8', marginBottom:'14px' }}>{selected.full_name} adli ogrencinin sinav gecmisi</div>

                {examResults.length === 0 ? (
                  <div style={{ background:'#F8FAFC', borderRadius:'12px', padding:'32px', textAlign:'center', color:'#94A3B8' }}>
                    <div style={{ fontSize:'24px', marginBottom:'8px' }}>📝</div>
                    Henuz sinav sonucu yok
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

                  return (
                    <div>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'8px', marginBottom:'14px' }}>
                        {[
                          { label:'Toplam Sinav', value: examList.length, color:'#1B3A6B', bg:'#EEF3FB' },
                          { label:'Genel Ort.', value: avg(allNets).toFixed(1)+' net', color:'#2E7D52', bg:'#DCFCE7' },
                          { label:'Son Sinav', value: examList.length > 0 ? (examList[examList.length-1] as any).totalNet.toFixed(1)+' net' : '-', color:'#B45309', bg:'#FEF3C7' },
                          { label:'Son Siralama', value: examList.length > 0 && (examList[examList.length-1] as any).rank ? (examList[examList.length-1] as any).rank+'. sira' : '-', color:'#6B4FC8', bg:'#EDE9FE' },
                        ].map(m => (
                          <div key={m.label} style={{ background:m.bg, borderRadius:'12px', padding:'12px', textAlign:'center' }}>
                            <div style={{ fontSize:'18px', fontWeight:800, color:m.color }}>{m.value}</div>
                            <div style={{ fontSize:'10px', color:m.color, opacity:0.7, marginTop:'3px' }}>{m.label}</div>
                          </div>
                        ))}
                      </div>

                      {examList.map((e: any, i: number) => {
                        const prev = i > 0 ? (examList[i-1] as any).totalNet : null
                        const diff = prev !== null ? e.totalNet - prev : null
                        return (
                          <div key={e.exam?.id} style={{ background:'#fff', borderRadius:'14px', border:'1px solid #E2E8F0', padding:'14px', marginBottom:'10px' }}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'10px' }}>
                              <div>
                                <div style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B' }}>{e.exam?.name}</div>
                                <div style={{ fontSize:'11px', color:'#94A3B8' }}>{e.exam?.exam_date ? new Date(e.exam.exam_date).toLocaleDateString('tr-TR') : '-'}</div>
                              </div>
                              <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                                {e.rank && (
                                  <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:e.rank<=3?['#FFD700','#C0C0C0','#CD7F32'][e.rank-1]:'#EEF3FB', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:800, color:e.rank<=3?'#fff':'#1B3A6B' }}>
                                    {e.rank}
                                  </div>
                                )}
                                {e.percentile && (
                                  <span style={{ fontSize:'10px', fontWeight:700, padding:'2px 7px', borderRadius:'10px', background:e.percentile>=75?'#DCFCE7':e.percentile>=50?'#EEF3FB':'#FEF2F2', color:e.percentile>=75?'#14532D':e.percentile>=50?'#1B3A6B':'#DC2626' }}>
                                    %{e.percentile}lik
                                  </span>
                                )}
                                <div style={{ textAlign:'right' }}>
                                  <div style={{ fontSize:'20px', fontWeight:800, color:'#1B3A6B' }}>{e.totalNet.toFixed(1)}</div>
                                  {diff !== null && <div style={{ fontSize:'10px', color:diff>0?'#14532D':diff<0?'#DC2626':'#94A3B8', fontWeight:700 }}>{diff>0?'+':''}{diff.toFixed(1)}</div>}
                                </div>
                              </div>
                            </div>
                            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'5px' }}>
                              {e.subjects.map((r: any) => (
                                <div key={r.id} style={{ display:'flex', justifyContent:'space-between', padding:'5px 8px', borderRadius:'7px', background:'#F8FAFC' }}>
                                  <span style={{ fontSize:'11px', color:'#475569', fontWeight:600 }}>{r.subjects?.name}</span>
                                  <span style={{ fontSize:'11px', fontWeight:700, color:r.net>=8?'#14532D':r.net>=5?'#B45309':'#DC2626' }}>{r.net.toFixed(1)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}
              </div>
            )}

            {/* AI RAPOR */}
            {activeTab === 'report' && (
              <div>
                <div style={{ fontSize:'16px', fontWeight:700, color:'#1B3A6B', marginBottom:'14px' }}>🤖 AI Veli Raporu</div>
                <div style={{ background:'#EDE9FE', borderRadius:'12px', padding:'16px', border:'1px solid #C4B5FD', marginBottom:'14px' }}>
                  <div style={{ fontSize:'13px', color:'#4C1D95', lineHeight:1.6, marginBottom:'12px' }}>
                    Yapay zeka, {selected.full_name} için kişiselleştirilmiş bir veli raporu hazırlar. Akademik performans, güçlü/zayıf konular ve eve öneriler içerir.
                  </div>
                  {aiReport ? (
                    <div style={{ fontSize:'13px', color:'#374151', lineHeight:1.8, whiteSpace:'pre-wrap' }}>{aiReport}</div>
                  ) : (
                    <button onClick={getAiReport} disabled={aiLoading}
                      style={{ width:'100%', padding:'12px', borderRadius:'10px', background:'#6B4FC8', color:'#fff', fontSize:'14px', fontWeight:700, border:'none', cursor:'pointer' }}>
                      {aiLoading ? 'Rapor Hazırlanıyor...' : '🤖 AI Raporu Oluştur'}
                    </button>
                  )}
                </div>

                {/* Öğretmen notları */}
                {calNotes.length > 0 && (
                  <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', overflow:'hidden' }}>
                    <div style={{ padding:'12px 16px', borderBottom:'1px solid #F1F5F9', fontSize:'13px', fontWeight:700, color:'#1B3A6B' }}>👨‍🏫 Öğretmen Notları</div>
                    {calNotes.map((n,i) => (
                      <div key={i} style={{ padding:'12px 16px', borderBottom: i<calNotes.length-1?'1px solid #F8FAFC':'none' }}>
                        <div style={{ fontSize:'11px', color:'#94A3B8', marginBottom:'4px' }}>{n.calendar_date} · {n.profiles?.full_name}</div>
                        <div style={{ fontSize:'13px', color:'#1E293B', lineHeight:1.6 }}>{n.note}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </>
        )}
      </div>

      <AccessibilityWidget />
    </div>
  )
}