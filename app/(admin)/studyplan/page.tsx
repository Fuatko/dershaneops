'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const DAYS = ['Pazartesi','Sali','Carsamba','Persembe','Cuma','Cumartesi','Pazar']
const TASK_TYPES: Record<string,{ label:string; color:string; bg:string }> = {
  new_topic:    { label:'Yeni Konu',     color:'#1B3A6B', bg:'#EEF3FB' },
  review:       { label:'Tekrar',        color:'#B45309', bg:'#FDF4E7' },
  exam_practice:{ label:'Sinav Hazirlik',color:'#6B4FC8', bg:'#EDE9FE' },
  weak_area:    { label:'Zayif Alan',    color:'#C0392B', bg:'#FEF2F2' },
}

// YKS 2025 tarihi
const YKS_DATE = new Date('2026-06-14')
const LGS_DATE = new Date('2026-06-07')

function daysLeft(target: Date) {
  const diff = target.getTime() - new Date().getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export default function StudyPlanPage() {
  const [students, setStudents]       = useState<any[]>([])
  const [selected, setSelected]       = useState<any>(null)
  const [topicPerf, setTopicPerf]     = useState<any[]>([])
  const [examResults, setExamResults] = useState<any[]>([])
  const [subjects, setSubjects]       = useState<any[]>([])
  const [plan, setPlan]               = useState<any[]>([])
  const [savedPlan, setSavedPlan]     = useState<any>(null)
  const [planHistory, setPlanHistory] = useState<any[]>([])
  const [loading, setLoading]         = useState(true)
  const [generating, setGenerating]   = useState(false)
  const [saving, setSaving]           = useState(false)
  const [examType, setExamType]       = useState<'YKS'|'LGS'|'KPSS'>('YKS')
  const [currentTenantId, setCurrentTenantId] = useState<string>('')
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: prof } = await supabase.from('profiles').select('tenant_id').eq('user_id', user.id).single()
      if (prof?.tenant_id) setCurrentTenantId(prof.tenant_id)
    }
    const { data: s } = await supabase.from('profiles').select('id, full_name, grade_level').eq('role', 'student').order('full_name')
    const { data: sub } = await supabase.from('subjects').select('*').order('name')
    setStudents(s??[]); setSubjects(sub??[]); setLoading(false)
  }

  async function selectStudent(s: any) {
    setSelected(s); setPlan([]); setSavedPlan(null)

    const [
      { data: tp },
      { data: existingPlan },
      { data: history },
      { data: exams },
    ] = await Promise.all([
      supabase.from('student_topic_performance').select('*, topics(name), subjects(name, color, id)').eq('student_id', s.id).order('accuracy_rate', { ascending:true }),
      supabase.from('study_plans').select('*, study_plan_items(*, subjects(name, color), topics(name))').eq('student_id', s.id).eq('status', 'active').order('created_at', { ascending:false }).limit(1).single(),
      supabase.from('study_plans').select('id, created_at, week_start_date, generated_by').eq('student_id', s.id).order('created_at', { ascending:false }).limit(5),
      supabase.from('exam_results').select('*, exams(name, exam_date), subjects(name)').eq('student_id', s.id).order('created_at', { ascending:false }).limit(10),
    ])

    setTopicPerf(tp??[])
    if (existingPlan) setSavedPlan(existingPlan)
    setPlanHistory(history??[])
    setExamResults(exams??[])

    // Otomatik sinav tipini tahmin et
    if (s.grade_level >= 9) setExamType('YKS')
    else if (s.grade_level === 8) setExamType('LGS')
  }

  async function generatePlan() {
    if (!selected || topicPerf.length === 0) return
    setGenerating(true); setPlan([])

    const weakTopics   = topicPerf.filter(t => t.accuracy_rate < 50)
    const mediumTopics = topicPerf.filter(t => t.accuracy_rate >= 50 && t.accuracy_rate < 70)
    const strongTopics = topicPerf.filter(t => t.accuracy_rate >= 70)

    // Son sinav analizi
    const examGroups = examResults.reduce((acc:any, r:any) => {
      if (!acc[r.exam_id]) acc[r.exam_id] = { exam: r.exams, subjects: [], totalNet: 0 }
      acc[r.exam_id].subjects.push(r)
      acc[r.exam_id].totalNet += r.net
      return acc
    }, {})
    const lastExam = Object.values(examGroups)[0] as any
    const prevExam = Object.values(examGroups)[1] as any
    const examTrend = lastExam && prevExam
      ? lastExam.totalNet > prevExam.totalNet ? 'artiyor' : lastExam.totalNet < prevExam.totalNet ? 'dusiyor' : 'stabil'
      : 'bilinmiyor'

    const targetDate = examType === 'YKS' ? YKS_DATE : LGS_DATE
    const daysRemaining = daysLeft(targetDate)

    try {
      const res = await fetch('/api/ai/studyplan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_name: selected.full_name,
          exam_type: examType,
          days_to_exam: daysRemaining,
          last_exam_net: lastExam?.totalNet?.toFixed(1) ?? 'bilinmiyor',
          exam_trend: examTrend,
          weak_topics:   weakTopics.map(t => ({ subject: t.subjects?.name, topic: t.topics?.name, rate: Math.round(t.accuracy_rate) })),
          medium_topics: mediumTopics.map(t => ({ subject: t.subjects?.name, topic: t.topics?.name, rate: Math.round(t.accuracy_rate) })),
          strong_topics: strongTopics.map(t => ({ subject: t.subjects?.name, topic: t.topics?.name, rate: Math.round(t.accuracy_rate) })),
        })
      })
      const d = await res.json()
      if (d.plan) setPlan(d.plan)
    } catch { alert('Plan olusturulamadi.') }
    setGenerating(false)
  }

  async function savePlan() {
    if (!selected || plan.length === 0) return
    setSaving(true)
    // Eski planlari pasife al
    await supabase.from('study_plans').update({ status: 'archived' }).eq('student_id', selected.id).eq('status', 'active')

    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)

    const { data: newPlan } = await supabase.from('study_plans').insert({
      tenant_id: currentTenantId,
      student_id: selected.id,
      week_start_date: weekStart.toISOString().slice(0,10),
      week_end_date: weekEnd.toISOString().slice(0,10),
      generated_by: 'ai',
      status: 'active',
    }).select().single()

    if (newPlan) {
      const items = plan.map((item:any) => ({
        study_plan_id: newPlan.id,
        day_of_week: item.day,
        subject_id: subjects.find(s => s.name === item.subject)?.id,
        task_type: item.task_type,
        task_description: item.description,
        question_count: item.question_count,
        target_duration_minutes: item.duration_minutes,
        difficulty_level: item.difficulty,
        priority_level: item.priority,
        status: 'pending',
      }))
      await supabase.from('study_plan_items').insert(items)
      setSavedPlan(newPlan)
    }
    setSaving(false)
    await selectStudent(selected)
  }

  const yksLeft = daysLeft(YKS_DATE)
  const lgsLeft = daysLeft(LGS_DATE)

  // Son sinav ozeti
  const examGroups = examResults.reduce((acc:any, r:any) => {
    if (!acc[r.exam_id]) acc[r.exam_id] = { exam: r.exams, total: 0 }
    acc[r.exam_id].total += r.net
    return acc
  }, {})
  const examList = Object.values(examGroups).slice(0,3) as any[]

  if (loading) return <div style={{ padding:'40px', textAlign:'center', color:'#7A8FA8' }}>Yukleniyor...</div>

  return (
    <div style={{ padding:'20px 16px', maxWidth:'1200px', fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif' }}>

      {/* Baslik + Geri sayim */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'20px', flexWrap:'wrap', gap:'12px' }}>
        <div>
          <h1 style={{ fontSize:'18px', fontWeight:700, color:'#1B3A6B', margin:0 }}>SmartPlan — Dinamik Calisma Plani</h1>
          <p style={{ fontSize:'12px', color:'#94A3B8', margin:'3px 0 0' }}>Son sinav sonucuna gore otomatik guncellenen AI plani</p>
        </div>
        <div style={{ display:'flex', gap:'8px' }}>
          <div style={{ background:'#1B3A6B', borderRadius:'10px', padding:'8px 14px', textAlign:'center' }}>
            <div style={{ fontSize:'20px', fontWeight:800, color:'#fff' }}>{yksLeft}</div>
            <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.7)' }}>YKS gun</div>
          </div>
          <div style={{ background:'#2E7D52', borderRadius:'10px', padding:'8px 14px', textAlign:'center' }}>
            <div style={{ fontSize:'20px', fontWeight:800, color:'#fff' }}>{lgsLeft}</div>
            <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.7)' }}>LGS gun</div>
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gap:'16px', gridTemplateColumns:'240px 1fr' }} className="sp-layout">

        {/* Sol panel */}
        <div>
          <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', overflow:'hidden', marginBottom:'10px' }}>
            <div style={{ padding:'12px 16px', borderBottom:'1px solid #F1F5F9', fontSize:'12.5px', fontWeight:700, color:'#1B3A6B' }}>Ogrenci Sec</div>
            <div style={{ maxHeight:'300px', overflowY:'auto' }}>
              {students.map(s => (
                <div key={s.id} onClick={() => selectStudent(s)}
                  style={{ padding:'10px 16px', borderBottom:'1px solid #F8FAFC', cursor:'pointer', background:selected?.id===s.id?'#EEF3FB':'#fff', borderLeft:selected?.id===s.id?'3px solid #1B3A6B':'3px solid transparent' }}>
                  <div style={{ fontSize:'12.5px', fontWeight:selected?.id===s.id?700:500, color:'#1B3A6B' }}>{s.full_name}</div>
                  {s.grade_level && <div style={{ fontSize:'10px', color:'#94A3B8' }}>{s.grade_level}. Sinif</div>}
                </div>
              ))}
            </div>
          </div>

          {selected && topicPerf.length > 0 && (
            <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'12px', marginBottom:'10px' }}>
              <div style={{ fontSize:'12px', fontWeight:700, color:'#1B3A6B', marginBottom:'8px' }}>Konu Durumu</div>
              {[
                { label:'Zayif', value:topicPerf.filter(t=>t.accuracy_rate<50).length, color:'#C0392B' },
                { label:'Gelisecek', value:topicPerf.filter(t=>t.accuracy_rate>=50&&t.accuracy_rate<70).length, color:'#B45309' },
                { label:'Guclu', value:topicPerf.filter(t=>t.accuracy_rate>=70).length, color:'#2E7D52' },
              ].map(m => (
                <div key={m.label} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid #F8FAFC', fontSize:'12px' }}>
                  <span style={{ color:'#7A8FA8' }}>{m.label}</span>
                  <span style={{ fontWeight:700, color:m.color }}>{m.value}</span>
                </div>
              ))}
            </div>
          )}

          {selected && examList.length > 0 && (
            <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'12px' }}>
              <div style={{ fontSize:'12px', fontWeight:700, color:'#1B3A6B', marginBottom:'8px' }}>Son Sinavlar</div>
              {examList.map((e:any, i:number) => {
                const prev = examList[i+1]
                const diff = prev ? e.total - prev.total : null
                return (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid #F8FAFC', fontSize:'11px' }}>
                    <span style={{ color:'#475569', flex:1, marginRight:'8px' }}>{e.exam?.name}</span>
                    <div style={{ textAlign:'right' }}>
                      <span style={{ fontWeight:700, color:'#1B3A6B' }}>{e.total.toFixed(1)}</span>
                      {diff !== null && <span style={{ fontSize:'10px', color:diff>0?'#2E7D52':diff<0?'#DC2626':'#94A3B8', marginLeft:'4px' }}>{diff>0?'+':''}{diff.toFixed(1)}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Sag panel */}
        <div>
          {!selected ? (
            <div style={{ background:'#F8FAFC', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'60px', textAlign:'center' }}>
              <div style={{ fontSize:'32px', marginBottom:'12px' }}>Ogrenci sec</div>
              <div style={{ fontSize:'14px', color:'#94A3B8' }}>Sol panelden bir ogrenci secin</div>
            </div>
          ) : topicPerf.length === 0 ? (
            <div style={{ background:'#FEF3C7', border:'1px solid #FCD34D', borderRadius:'12px', padding:'40px', textAlign:'center' }}>
              <div style={{ fontSize:'14px', color:'#92400E' }}>Henuz konu performans verisi yok</div>
            </div>
          ) : (
            <div>
              {/* Sinav tipi + generate butonu */}
              <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'14px 16px', marginBottom:'14px', display:'flex', alignItems:'center', gap:'12px', flexWrap:'wrap' }}>
                <div style={{ fontSize:'13px', fontWeight:600, color:'#1B3A6B' }}>Hedef Sinav:</div>
                <div style={{ display:'flex', gap:'6px' }}>
                  {(['YKS','LGS','KPSS'] as const).map(t => (
                    <button key={t} onClick={() => setExamType(t)}
                      style={{ padding:'5px 14px', borderRadius:'20px', border:'1.5px solid', borderColor:examType===t?'#1B3A6B':'#E2E8F0', background:examType===t?'#1B3A6B':'#fff', color:examType===t?'#fff':'#475569', fontSize:'12px', fontWeight:600, cursor:'pointer' }}>
                      {t}
                    </button>
                  ))}
                </div>
                <div style={{ marginLeft:'auto', display:'flex', gap:'8px' }}>
                  <button onClick={generatePlan} disabled={generating}
                    style={{ padding:'9px 18px', borderRadius:'9px', background:'#6B4FC8', color:'#fff', fontSize:'13px', fontWeight:700, border:'none', cursor:'pointer' }}>
                    {generating ? 'AI Olusturuyor...' : 'AI ile Plan Olustur'}
                  </button>
                  {plan.length > 0 && (
                    <button onClick={savePlan} disabled={saving}
                      style={{ padding:'9px 18px', borderRadius:'9px', background:'#2E7D52', color:'#fff', fontSize:'13px', fontWeight:700, border:'none', cursor:'pointer' }}>
                      {saving ? 'Kaydediliyor...' : 'Plani Kaydet'}
                    </button>
                  )}
                </div>
              </div>

              {/* Plan gecmisi */}
              {planHistory.length > 0 && plan.length === 0 && (
                <div style={{ background:'#EEF3FB', border:'1px solid #BFDBFE', borderRadius:'10px', padding:'10px 14px', marginBottom:'12px', fontSize:'12px', color:'#1B3A6B' }}>
                  Bu ogrenci icin {planHistory.length} gecmis plan var. Yeni plan olusturmak icin butona basin.
                </div>
              )}

              {/* Plan gosterimi */}
              {plan.length > 0 && (
                <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', overflow:'hidden' }}>
                  <div style={{ padding:'12px 16px', borderBottom:'1px solid #F1F5F9', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <span style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B' }}>{selected.full_name} — {examType} Haftalik Plani</span>
                    <span style={{ fontSize:'11px', color:'#94A3B8' }}>{plan.length} gorev · {examType} icin {examType==='YKS'?yksLeft:lgsLeft} gun kaldi</span>
                  </div>
                  {DAYS.map((day, dayIndex) => {
                    const dayTasks = plan.filter((p:any) => p.day === dayIndex+1)
                    if (dayTasks.length === 0) return null
                    return (
                      <div key={day} style={{ borderBottom:'1px solid #F1F5F9' }}>
                        <div style={{ padding:'8px 16px', background:'#F8FAFC', fontSize:'12px', fontWeight:700, color:'#1B3A6B', borderBottom:'1px solid #F1F5F9' }}>
                          {day} <span style={{ marginLeft:'6px', fontSize:'11px', color:'#7A8FA8', fontWeight:400 }}>{dayTasks.reduce((s:number,t:any)=>s+t.duration_minutes,0)} dk</span>
                        </div>
                        {dayTasks.map((task:any, ti:number) => {
                          const tt = TASK_TYPES[task.task_type] ?? TASK_TYPES.new_topic
                          return (
                            <div key={ti} style={{ padding:'10px 16px', borderBottom:ti<dayTasks.length-1?'1px solid #F8FAFC':'none' }}>
                              <div style={{ display:'flex', alignItems:'flex-start', gap:'10px' }}>
                                <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:tt.color, flexShrink:0, marginTop:'5px' }} />
                                <div style={{ flex:1 }}>
                                  <div style={{ fontSize:'13px', fontWeight:600, color:'#1B3A6B', marginBottom:'3px' }}>{task.subject} — {task.topic}</div>
                                  <div style={{ fontSize:'12px', color:'#475569', marginBottom:'6px' }}>{task.description}</div>
                                  <div style={{ display:'flex', gap:'5px', flexWrap:'wrap' }}>
                                    <span style={{ fontSize:'11px', fontWeight:600, padding:'2px 8px', borderRadius:'10px', background:tt.bg, color:tt.color }}>{tt.label}</span>
                                    <span style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'10px', background:'#F1F5F9', color:'#475569' }}>{task.question_count} soru</span>
                                    <span style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'10px', background:'#F1F5F9', color:'#475569' }}>{task.duration_minutes} dk</span>
                                    {task.priority === 'high' && <span style={{ fontSize:'11px', fontWeight:700, padding:'2px 8px', borderRadius:'10px', background:'#FEF2F2', color:'#DC2626' }}>Oncelikli</span>}
                                  </div>
                                </div>
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
        </div>
      </div>

      <style>{`
        @media (max-width: 767px) {
          .sp-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
