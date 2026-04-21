'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ScenarioPage() {
  const [students, setStudents] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [topicPerf, setTopicPerf] = useState<any[]>([])
  const [examResults, setExamResults] = useState<any[]>([])
  const [goals, setGoals] = useState<any[]>([])
  const [riskScore, setRiskScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [aiResult, setAiResult] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [scenario, setScenario] = useState({ extra_lessons_per_week:0, extra_study_hours_per_day:0, focus_subject:'', months:3 })
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('profiles').select('id, full_name').eq('role', 'student').order('full_name')
    setStudents(data??[]); setLoading(false)
  }

  async function selectStudent(s: any) {
    setSelected(s); setAiResult('')
    const [{ data: tp }, { data: er }, { data: g }, { data: risk }] = await Promise.all([
      supabase.from('student_topic_performance').select('*, subjects(name)').eq('student_id', s.id),
      supabase.from('exam_results').select('*, exams(exam_date)').eq('student_id', s.id).order('created_at', { ascending:true }),
      supabase.from('student_goals').select('*').eq('student_id', s.id).eq('status', 'active'),
      supabase.rpc('calculate_risk_score', { p_student_id:s.id }),
    ])
    setTopicPerf(tp??[]); setExamResults(er??[]); setGoals(g??[]); setRiskScore(risk??0)
  }

  async function runScenario() {
    if (!selected) return
    setAiLoading(true); setAiResult('')
    const totalQ = topicPerf.reduce((s,t)=>s+t.total_questions,0)
    const totalC = topicPerf.reduce((s,t)=>s+t.correct_count,0)
    const overallRate = totalQ>0 ? Math.round(totalC/totalQ*100) : 0
    const examGroups: any = {}
    examResults.forEach(r=>{ if (!examGroups[r.exam_id]) examGroups[r.exam_id]={ totalNet:0 }; examGroups[r.exam_id].totalNet+=r.net })
    const nets = Object.values(examGroups).map((e:any)=>e.totalNet)
    const avgNet = nets.length>0 ? Math.round(nets.reduce((a,b)=>a+b,0)/nets.length*100)/100 : 0
    const weakTopics = topicPerf.filter(t=>t.accuracy_rate<50).map(t=>t.subjects?.name).filter(Boolean)
    const goal = goals[0]
    try {
      const res = await fetch('/api/ai/scenario', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ student_name:selected.full_name, overall_rate:overallRate, avg_net:avgNet, risk_score:Math.round(riskScore), weak_subjects:weakTopics.slice(0,3).join(', ')||'Yok', target_exam:goal?.target_exam??'Belirtilmemiş', target_score:goal?.target_score??0, current_score:goal?.current_score??0, extra_lessons:scenario.extra_lessons_per_week, extra_study_hours:scenario.extra_study_hours_per_day, focus_subject:scenario.focus_subject||'Belirtilmemiş', months:scenario.months }) })
      const d = await res.json(); setAiResult(d.result??'')
    } catch { setAiResult('Senaryo analizi alınamadı.') }
    setAiLoading(false)
  }

  const subjects = [...new Set(topicPerf.map(t=>t.subjects?.name).filter(Boolean))]
  const totalQ = topicPerf.reduce((s,t)=>s+t.total_questions,0)
  const totalC = topicPerf.reduce((s,t)=>s+t.correct_count,0)
  const overallRate = totalQ>0 ? Math.round(totalC/totalQ*100) : 0
  const inp: React.CSSProperties = { width:'100%', padding:'8px 10px', borderRadius:'7px', border:'1px solid #E2E8F0', fontSize:'12.5px', color:'#1B3A6B', outline:'none', background:'#fff', boxSizing:'border-box' }
  const lbl: React.CSSProperties = { display:'block', fontSize:'11px', fontWeight:600, color:'#475569', marginBottom:'5px', textTransform:'uppercase', letterSpacing:'0.3px' }

  if (loading) return <div style={{ padding:'40px', textAlign:'center', color:'#7A8FA8' }}>Yükleniyor...</div>

  return (
    <div className="admin-page">
      <div style={{ marginBottom:'20px' }}>
        <h1>Senaryo Motoru</h1>
        <p style={{ fontSize:'12px', color:'#7A8FA8', margin:'3px 0 0' }}>AI destekli senaryo analizi</p>
      </div>

      <div className="sidebar-dropdown">
        <select value={selected?.id??''} onChange={e=>{ const s=students.find(x=>x.id===e.target.value); if(s) selectStudent(s) }}>
          <option value="">Öğrenci seçin...</option>
          {students.map(s=><option key={s.id} value={s.id}>{s.full_name}</option>)}
        </select>
      </div>

      <div className="sidebar-layout">
        <div className="sidebar-list">
          <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', overflow:'hidden' }}>
            <div style={{ padding:'12px 16px', borderBottom:'1px solid #F1F5F9', fontSize:'12.5px', fontWeight:700, color:'#1B3A6B' }}>Öğrenci Seç</div>
            <div style={{ maxHeight:'400px', overflowY:'auto' }}>
              {students.map(s=>(
                <div key={s.id} onClick={()=>selectStudent(s)} style={{ padding:'10px 16px', borderBottom:'1px solid #F8FAFC', cursor:'pointer', display:'flex', alignItems:'center', gap:'10px', background:selected?.id===s.id?'#F5F8FF':'#fff', borderLeft:selected?.id===s.id?'3px solid #1B3A6B':'3px solid transparent' }}>
                  <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:selected?.id===s.id?'#1B3A6B':'#EEF3FB', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:700, color:selected?.id===s.id?'#fff':'#1B3A6B', flexShrink:0 }}>
                    {s.full_name?.split(' ').map((n:string)=>n[0]).join('').slice(0,2)}
                  </div>
                  <span style={{ fontSize:'12.5px', fontWeight:selected?.id===s.id?700:500, color:'#1B3A6B' }}>{s.full_name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {!selected ? (
          <div style={{ background:'#F8FAFC', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'48px', textAlign:'center' }}>
            <div style={{ fontSize:'36px', marginBottom:'10px' }}>🔮</div>
            <div style={{ fontSize:'14px', color:'#7A8FA8' }}>Senaryo çalıştırmak için öğrenci seçin</div>
          </div>
        ) : (
          <div>
            <div className="grid-3" style={{ marginBottom:'14px' }}>
              {[
                { label:'Mevcut Başarı', value:'%'+overallRate, color:overallRate>=70?'#14532D':overallRate>=50?'#92400E':'#7F1D1D', bg:overallRate>=70?'#DCFCE7':'#FEF3C7' },
                { label:'Risk Skoru', value:Math.round(riskScore), color:riskScore>=70?'#7F1D1D':riskScore>=45?'#92400E':'#14532D', bg:riskScore>=70?'#FEF2F2':riskScore>=45?'#FEF3C7':'#DCFCE7' },
                { label:'Hedef', value:goals[0]?goals[0].target_exam+' '+goals[0].target_score:'Belirsiz', color:'#4C1D95', bg:'#EDE9FE' },
              ].map(m=>(
                <div key={m.label} style={{ background:m.bg, borderRadius:'10px', padding:'12px 14px' }}>
                  <div style={{ fontSize:'11px', color:m.color, fontWeight:600, marginBottom:'3px' }}>{m.label}</div>
                  <div style={{ fontSize:'16px', fontWeight:700, color:m.color }}>{m.value}</div>
                </div>
              ))}
            </div>

            <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'16px', marginBottom:'14px' }}>
              <div style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B', marginBottom:'14px' }}>🔮 Senaryo Parametreleri</div>
              <div className="grid-2" style={{ marginBottom:'14px' }}>
                <div>
                  <label style={lbl}>Haftalık Ek Ders</label>
                  <div style={{ display:'flex', gap:'4px', flexWrap:'wrap' }}>
                    {[0,1,2,3,4,5].map(n=>(
                      <button key={n} onClick={()=>setScenario(p=>({...p,extra_lessons_per_week:n}))} style={{ flex:1, minWidth:'32px', padding:'8px 4px', borderRadius:'7px', border:'1.5px solid', borderColor:scenario.extra_lessons_per_week===n?'#1B3A6B':'#E2E8F0', background:scenario.extra_lessons_per_week===n?'#1B3A6B':'#fff', color:scenario.extra_lessons_per_week===n?'#fff':'#475569', fontSize:'13px', fontWeight:700, cursor:'pointer' }}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={lbl}>Günlük Ek Çalışma (saat)</label>
                  <div style={{ display:'flex', gap:'4px', flexWrap:'wrap' }}>
                    {[0,0.5,1,1.5,2,3].map(n=>(
                      <button key={n} onClick={()=>setScenario(p=>({...p,extra_study_hours_per_day:n}))} style={{ flex:1, minWidth:'32px', padding:'8px 2px', borderRadius:'7px', border:'1.5px solid', borderColor:scenario.extra_study_hours_per_day===n?'#2E7D52':'#E2E8F0', background:scenario.extra_study_hours_per_day===n?'#2E7D52':'#fff', color:scenario.extra_study_hours_per_day===n?'#fff':'#475569', fontSize:'11px', fontWeight:700, cursor:'pointer' }}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={lbl}>Odak Ders</label>
                  <select value={scenario.focus_subject} onChange={e=>setScenario(p=>({...p,focus_subject:e.target.value}))} style={inp}>
                    <option value="">Genel (tüm dersler)</option>
                    {subjects.map(s=><option key={s as string} value={s as string}>{s as string}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Süre (ay)</label>
                  <div style={{ display:'flex', gap:'4px', flexWrap:'wrap' }}>
                    {[1,2,3,6,9,12].map(n=>(
                      <button key={n} onClick={()=>setScenario(p=>({...p,months:n}))} style={{ flex:1, minWidth:'32px', padding:'8px 4px', borderRadius:'7px', border:'1.5px solid', borderColor:scenario.months===n?'#6B4FC8':'#E2E8F0', background:scenario.months===n?'#6B4FC8':'#fff', color:scenario.months===n?'#fff':'#475569', fontSize:'12px', fontWeight:700, cursor:'pointer' }}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ background:'#F8FAFC', borderRadius:'10px', padding:'12px 14px', marginBottom:'14px', border:'1px solid #E2E8F0', fontSize:'12.5px', color:'#475569', lineHeight:1.7 }}>
                <strong style={{ color:'#1B3A6B' }}>Senaryo:</strong> {selected.full_name} önümüzdeki <strong>{scenario.months} ay</strong> boyunca
                {scenario.extra_lessons_per_week>0&&<span> haftada <strong>{scenario.extra_lessons_per_week} ek ders</strong> alsa</span>}
                {scenario.extra_lessons_per_week>0&&scenario.extra_study_hours_per_day>0&&' ve'}
                {scenario.extra_study_hours_per_day>0&&<span> günde <strong>{scenario.extra_study_hours_per_day} saat ek</strong> çalışsa</span>}
                {scenario.focus_subject&&<span>, <strong>{scenario.focus_subject}</strong> dersine odaklansa</span>}
                {scenario.extra_lessons_per_week===0&&scenario.extra_study_hours_per_day===0&&' mevcut gidişatla devam etse'}
                {' '}ne olur?
              </div>

              <button onClick={runScenario} disabled={aiLoading} style={{ width:'100%', padding:'12px', borderRadius:'10px', background:'#1B3A6B', color:'#fff', fontSize:'14px', fontWeight:700, border:'none', cursor:'pointer' }}>
                {aiLoading?'🔮 AI Senaryo Hesaplıyor...':'🔮 Senaryoyu Çalıştır'}
              </button>
            </div>

            {aiResult && (
              <div style={{ background:'#fff', borderRadius:'12px', border:'2px solid #1B3A6B', overflow:'hidden' }}>
                <div style={{ background:'#1B3A6B', padding:'12px 16px', display:'flex', alignItems:'center', gap:'10px' }}>
                  <span style={{ fontSize:'18px' }}>🔮</span>
                  <div>
                    <div style={{ fontSize:'14px', fontWeight:700, color:'#fff' }}>AI Senaryo Analizi</div>
                    <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.7)' }}>{selected.full_name} için {scenario.months} aylık projeksiyon</div>
                  </div>
                </div>
                <div style={{ padding:'16px' }}>
                  <div style={{ fontSize:'13px', color:'#374151', lineHeight:1.9, whiteSpace:'pre-wrap' }}>{aiResult}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}