'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const DAYS = ['Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi','Pazar']
const TASK_TYPES: Record<string,{ label:string; color:string; bg:string }> = {
  new_topic: { label:'Yeni Konu', color:'#1B3A6B', bg:'#EEF3FB' },
  review: { label:'Tekrar', color:'#B45309', bg:'#FDF4E7' },
  exam_practice: { label:'Sınav Hazırlık', color:'#6B4FC8', bg:'#EDE9FE' },
  weak_area: { label:'Zayıf Alan', color:'#C0392B', bg:'#FEF2F2' },
}

export default function StudyPlanPage() {
  const [students, setStudents] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [topicPerf, setTopicPerf] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [plan, setPlan] = useState<any[]>([])
  const [savedPlan, setSavedPlan] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)

  // Tenant ID'yi otomatik al
  const [currentTenantId, setCurrentTenantId] = useState<string>('')
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {

    // Tenant ID'yi yükle
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: prof } = await supabase.from('profiles').select('tenant_id').eq('user_id', user.id).single()
      if (prof?.tenant_id) setCurrentTenantId(prof.tenant_id)
    }

    const { data: s } = await supabase.from('profiles').select('id, full_name').eq('role', 'student').order('full_name')
    const { data: sub } = await supabase.from('subjects').select('*').order('name')
    setStudents(s??[]); setSubjects(sub??[]); setLoading(false)
  }

  async function selectStudent(s: any) {
    setSelected(s); setPlan([]); setSavedPlan(null)
    const { data: tp } = await supabase.from('student_topic_performance').select('*, topics(name), subjects(name, color, id)').eq('student_id', s.id).order('accuracy_rate', { ascending:true })
    setTopicPerf(tp??[])
    const { data: existingPlan } = await supabase.from('study_plans').select('*, study_plan_items(*, subjects(name, color), topics(name))').eq('student_id', s.id).eq('status', 'active').order('created_at', { ascending:false }).limit(1).single()
    if (existingPlan) setSavedPlan(existingPlan)
  }

  async function generatePlan() {
    if (!selected||topicPerf.length===0) return
    setGenerating(true); setPlan([])
    const weakTopics = topicPerf.filter(t=>t.accuracy_rate<50)
    const mediumTopics = topicPerf.filter(t=>t.accuracy_rate>=50&&t.accuracy_rate<70)
    const strongTopics = topicPerf.filter(t=>t.accuracy_rate>=70)
    try {
      const res = await fetch('/api/ai/studyplan', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ student_name:selected.full_name, weak_topics:weakTopics.map(t=>({ subject:t.subjects?.name, topic:t.topics?.name, rate:Math.round(t.accuracy_rate) })), medium_topics:mediumTopics.map(t=>({ subject:t.subjects?.name, topic:t.topics?.name, rate:Math.round(t.accuracy_rate) })), strong_topics:strongTopics.map(t=>({ subject:t.subjects?.name, topic:t.topics?.name, rate:Math.round(t.accuracy_rate) })) }) })
      const d = await res.json(); if (d.plan) setPlan(d.plan)
    } catch { alert('Plan oluşturulamadı.') }
    setGenerating(false)
  }

  async function savePlan() {
    if (!selected||plan.length===0) return
    setSaving(true)
    const weekStart = new Date(); weekStart.setDate(weekStart.getDate()-weekStart.getDay()+1)
    const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate()+6)
    const { data: newPlan } = await supabase.from('study_plans').insert({ tenant_id: currentTenantId, student_id:selected.id, week_start_date:weekStart.toISOString().slice(0,10), week_end_date:weekEnd.toISOString().slice(0,10), generated_by:'ai', status:'active' }).select().single()
    if (newPlan) {
      const items = plan.map((item:any) => ({ study_plan_id:newPlan.id, day_of_week:item.day, subject_id:subjects.find(s=>s.name===item.subject)?.id, task_type:item.task_type, task_description:item.description, question_count:item.question_count, target_duration_minutes:item.duration_minutes, difficulty_level:item.difficulty, priority_level:item.priority, status:'pending' }))
      await supabase.from('study_plan_items').insert(items)
      setSavedPlan(newPlan); alert('Plan kaydedildi!')
    }
    setSaving(false)
  }

  if (loading) return <div style={{ padding:'40px', textAlign:'center', color:'#7A8FA8' }}>Yükleniyor...</div>

  return (
    <div style={{ padding:'20px 16px', maxWidth:'1200px' }}>
      <div style={{ marginBottom:'20px' }}>
        <h1 style={{ fontSize:'18px', fontWeight:700, color:'#1B3A6B', margin:0 }}>Haftalık Çalışma Planı</h1>
        <p style={{ fontSize:'12px', color:'#7A8FA8', margin:'3px 0 0' }}>AI destekli kişiselleştirilmiş haftalık çalışma planı</p>
      </div>

      {/* Mobil: dropdown */}
      <div className="sp-mobile-only" style={{ marginBottom:'12px' }}>
        <select value={selected?.id??''} onChange={e => { const s=students.find(x=>x.id===e.target.value); if(s) selectStudent(s) }}
          style={{ width:'100%', padding:'10px 12px', borderRadius:'8px', border:'1px solid #E2E8F0', fontSize:'13px', color:'#1B3A6B', background:'#fff', outline:'none' }}>
          <option value="">Öğrenci seçin...</option>
          {students.map(s=><option key={s.id} value={s.id}>{s.full_name}</option>)}
        </select>
      </div>

      <div className="sp-layout">
        {/* Sol: öğrenci listesi */}
        <div className="sp-desktop-only">
          <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', overflow:'hidden' }}>
            <div style={{ padding:'12px 16px', borderBottom:'1px solid #F1F5F9', fontSize:'12.5px', fontWeight:700, color:'#1B3A6B' }}>Öğrenci Seç</div>
            {students.map(s => (
              <div key={s.id} onClick={() => selectStudent(s)} style={{ padding:'10px 16px', borderBottom:'1px solid #F8FAFC', cursor:'pointer', display:'flex', alignItems:'center', gap:'10px', background:selected?.id===s.id?'#F5F8FF':'#fff', borderLeft:selected?.id===s.id?'3px solid #1B3A6B':'3px solid transparent' }}>
                <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:selected?.id===s.id?'#1B3A6B':'#EEF3FB', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:700, color:selected?.id===s.id?'#fff':'#1B3A6B', flexShrink:0 }}>
                  {s.full_name?.split(' ').map((n:string)=>n[0]).join('').slice(0,2)}
                </div>
                <span style={{ fontSize:'12.5px', fontWeight:selected?.id===s.id?700:500, color:'#1B3A6B' }}>{s.full_name}</span>
              </div>
            ))}
          </div>
          {selected&&topicPerf.length>0 && (
            <div style={{ marginTop:'10px', background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'12px' }}>
              <div style={{ fontSize:'12px', fontWeight:700, color:'#1B3A6B', marginBottom:'8px' }}>Konu Durumu</div>
              {[
                { label:'Zayıf', value:topicPerf.filter(t=>t.accuracy_rate<50).length, color:'#C0392B' },
                { label:'Gelişecek', value:topicPerf.filter(t=>t.accuracy_rate>=50&&t.accuracy_rate<70).length, color:'#B45309' },
                { label:'Güçlü', value:topicPerf.filter(t=>t.accuracy_rate>=70).length, color:'#2E7D52' },
              ].map(m => (
                <div key={m.label} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid #F8FAFC', fontSize:'12px' }}>
                  <span style={{ color:'#7A8FA8' }}>{m.label}</span>
                  <span style={{ fontWeight:700, color:m.color }}>{m.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sağ panel */}
        <div>
          {!selected ? (
            <div className="sp-desktop-only" style={{ background:'#F8FAFC', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'60px', textAlign:'center' }}>
              <div style={{ fontSize:'14px', color:'#7A8FA8' }}>Sol panelden bir öğrenci seçin</div>
            </div>
          ) : topicPerf.length===0 ? (
            <div style={{ background:'#FEF3C7', border:'1px solid #FCD34D', borderRadius:'12px', padding:'40px', textAlign:'center' }}>
              <div style={{ fontSize:'14px', color:'#92400E' }}>Henüz konu performans verisi yok</div>
            </div>
          ) : (
            <>
              <div style={{ display:'flex', gap:'10px', marginBottom:'14px', flexWrap:'wrap' }}>
                <button onClick={generatePlan} disabled={generating} style={{ flex:1, minWidth:'160px', padding:'11px', borderRadius:'9px', background:'#6B4FC8', color:'#fff', fontSize:'13px', fontWeight:700, border:'none', cursor:'pointer' }}>
                  {generating?'AI Plan Oluşturuyor...':'AI ile Plan Oluştur'}
                </button>
                {plan.length>0 && (
                  <button onClick={savePlan} disabled={saving} style={{ padding:'11px 18px', borderRadius:'9px', background:'#2E7D52', color:'#fff', fontSize:'13px', fontWeight:700, border:'none', cursor:'pointer' }}>
                    {saving?'Kaydediliyor...':'Planı Kaydet'}
                  </button>
                )}
              </div>
              {savedPlan&&plan.length===0 && (
                <div style={{ background:'#DCFCE7', border:'1px solid #86EFAC', borderRadius:'10px', padding:'10px 14px', marginBottom:'12px', fontSize:'12.5px', color:'#14532D', fontWeight:600 }}>
                  Mevcut aktif plan bulundu. Yeni plan oluşturmak için butona basın.
                </div>
              )}
              {plan.length>0 && (
                <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', overflow:'hidden' }}>
                  <div style={{ padding:'12px 16px', borderBottom:'1px solid #F1F5F9', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <span style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B' }}>{selected.full_name} — Haftalık Plan</span>
                    <span style={{ fontSize:'11px', color:'#7A8FA8' }}>{plan.length} görev</span>
                  </div>
                  {DAYS.map((day,dayIndex) => {
                    const dayTasks = plan.filter((p:any)=>p.day===dayIndex+1)
                    if (dayTasks.length===0) return null
                    return (
                      <div key={day} style={{ borderBottom:'1px solid #F1F5F9' }}>
                        <div style={{ padding:'8px 16px', background:'#F8FAFC', fontSize:'12px', fontWeight:700, color:'#1B3A6B', borderBottom:'1px solid #F1F5F9' }}>
                          {day} <span style={{ marginLeft:'6px', fontSize:'11px', color:'#7A8FA8', fontWeight:400 }}>{dayTasks.reduce((s:number,t:any)=>s+t.duration_minutes,0)} dk</span>
                        </div>
                        {dayTasks.map((task:any,ti:number) => {
                          const tt = TASK_TYPES[task.task_type]??TASK_TYPES.new_topic
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
            </>
          )}
        </div>
      </div>

      <style>{`
        .sp-layout { display:grid; gap:16px; grid-template-columns:1fr; }
        .sp-mobile-only { display:block; }
        .sp-desktop-only { display:none; }
        @media (min-width:768px) {
          .sp-layout { grid-template-columns:240px 1fr; }
          .sp-mobile-only { display:none !important; }
          .sp-desktop-only { display:block !important; }
        }
      `}</style>
    </div>
  )
}