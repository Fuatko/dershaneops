'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function PredictionPage() {
  const [students, setStudents] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [topicPerf, setTopicPerf] = useState<any[]>([])
  const [examResults, setExamResults] = useState<any[]>([])
  const [goals, setGoals] = useState<any[]>([])
  const [riskScore, setRiskScore] = useState(0)
  const [prediction, setPrediction] = useState<any>(null)
  const [aiPrediction, setAiPrediction] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('profiles').select('id, full_name').eq('role', 'student').order('full_name')
    setStudents(data??[]); setLoading(false)
  }

  async function selectStudent(s: any) {
    setSelected(s); setPrediction(null); setAiPrediction('')
    const [{ data: tp }, { data: er }, { data: g }, { data: risk }] = await Promise.all([
      supabase.from('student_topic_performance').select('*, subjects(name)').eq('student_id', s.id),
      supabase.from('exam_results').select('*, exams(exam_date)').eq('student_id', s.id).order('created_at', { ascending:true }),
      supabase.from('student_goals').select('*').eq('student_id', s.id).eq('status', 'active'),
      supabase.rpc('calculate_risk_score', { p_student_id:s.id }),
    ])
    setTopicPerf(tp??[]); setExamResults(er??[]); setGoals(g??[]); setRiskScore(risk??0)
    calculatePrediction(tp??[], er??[], g??[], risk??0)
  }

  function calculatePrediction(tp: any[], er: any[], g: any[], risk: number) {
    const totalQ = tp.reduce((s,t)=>s+t.total_questions,0)
    const totalC = tp.reduce((s,t)=>s+t.correct_count,0)
    const overallRate = totalQ>0 ? Math.round(totalC/totalQ*100) : 0
    const examGroups: any = {}
    er.forEach(r => { if (!examGroups[r.exam_id]) examGroups[r.exam_id]={ totalNet:0, date:r.exams?.exam_date }; examGroups[r.exam_id].totalNet+=r.net })
    const examNets = Object.values(examGroups).sort((a:any,b:any)=>new Date(a.date).getTime()-new Date(b.date).getTime()).map((e:any)=>e.totalNet)
    const last3 = examNets.slice(-3)
    const avg3 = last3.length>0 ? last3.reduce((a,b)=>a+b,0)/last3.length : 0
    let trendScore = 0
    if (examNets.length>=2) {
      const first = examNets.slice(0,Math.floor(examNets.length/2))
      const second = examNets.slice(Math.floor(examNets.length/2))
      trendScore = second.reduce((a,b)=>a+b,0)/second.length - first.reduce((a,b)=>a+b,0)/first.length
    }
    const improvementRate = trendScore>0 ? Math.min(trendScore/examNets.length*2,5) : -1
    const goalProbabilities = g.map(goal => {
      const gap = goal.target_score-goal.current_score
      const monthsLeft = goal.target_date ? Math.max(Math.round((new Date(goal.target_date).getTime()-Date.now())/(1000*60*60*24*30)),1) : 12
      const needed = gap/monthsLeft
      const prob = improvementRate>=needed*0.7 ? Math.min(Math.round((improvementRate/needed)*60+30),95) : Math.max(Math.round(30-(needed-improvementRate)*5),5)
      return { ...goal, probability:prob, months_left:monthsLeft, needed_monthly:Math.round(needed*10)/10 }
    })
    const subjectPredictions = tp.reduce((acc:any,t)=>{
      const name = t.subjects?.name??'Diğer'
      if (!acc[name]) acc[name]={ rates:[], name }
      acc[name].rates.push(t.accuracy_rate); return acc
    }, {})
    const subjectForecasts = Object.values(subjectPredictions).map((s:any)=>{
      const avg = s.rates.reduce((a:number,b:number)=>a+b,0)/s.rates.length
      const projected = Math.min(avg+(risk<30?5:risk<60?2:-3),100)
      return { name:s.name, current:Math.round(avg), projected:Math.round(projected) }
    })
    setPrediction({ overallRate, avg3:Math.round(avg3*100)/100, expectedNext:Math.round((avg3+improvementRate)*100)/100, expected3Month:Math.round((avg3+improvementRate*3)*100)/100, expected6Month:Math.round((avg3+improvementRate*6)*100)/100, trendScore:Math.round(trendScore*100)/100, improvementRate:Math.round(improvementRate*100)/100, goalProbabilities, subjectForecasts, examCount:examNets.length })
  }

  async function getAiPrediction() {
    if (!selected||!prediction) return
    setAiLoading(true); setAiPrediction('')
    try {
      const res = await fetch('/api/ai/prediction', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ student_name:selected.full_name, overall_rate:prediction.overallRate, risk_score:Math.round(riskScore), avg_net:prediction.avg3, expected_next:prediction.expectedNext, expected_3month:prediction.expected3Month, trend:prediction.trendScore>0?'yükseliyor':prediction.trendScore<0?'düşüyor':'stabil', goal_probabilities:prediction.goalProbabilities.map((g:any)=>g.target_exam+':%'+g.probability).join(', '), subject_forecasts:prediction.subjectForecasts.map((s:any)=>s.name+' '+s.current+'→'+s.projected).join(', ') }) })
      const d = await res.json(); setAiPrediction(d.prediction??'')
    } catch { setAiPrediction('AI tahmini alınamadı.') }
    setAiLoading(false)
  }

  if (loading) return <div style={{ padding:'40px', textAlign:'center', color:'#7A8FA8' }}>Yükleniyor...</div>

  return (
    <div className="admin-page">
      <div style={{ marginBottom:'20px' }}>
        <h1>Tahmin Motoru</h1>
        <p style={{ fontSize:'12px', color:'#7A8FA8', margin:'3px 0 0' }}>Beklenen skor, hedef ulaşma olasılığı ve gelişim tahmini</p>
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
            <div style={{ fontSize:'14px', color:'#7A8FA8' }}>Öğrenci seçin</div>
          </div>
        ) : !prediction ? (
          <div style={{ background:'#FEF3C7', border:'1px solid #FCD34D', borderRadius:'12px', padding:'40px', textAlign:'center' }}>
            <div style={{ fontSize:'14px', color:'#92400E' }}>Yeterli veri yok. Deneme sınavı sonuçları girilmeli.</div>
          </div>
        ) : (
          <div>
            <div className="metrics-row">
              {[
                { label:'Son 3 Ortalama', value:prediction.avg3, sub:prediction.examCount+' sınav', color:'#1B3A6B', bg:'#EEF3FB' },
                { label:'Sonraki Sınav', value:prediction.expectedNext, sub:prediction.trendScore>0?'↑ Yükseliyor':prediction.trendScore<0?'↓ Düşüyor':'→ Stabil', color:prediction.trendScore>0?'#14532D':prediction.trendScore<0?'#7F1D1D':'#1B3A6B', bg:prediction.trendScore>0?'#DCFCE7':prediction.trendScore<0?'#FEF2F2':'#EEF3FB' },
                { label:'3 Ay Sonra', value:prediction.expected3Month, sub:'Tahmini net', color:'#4C1D95', bg:'#EDE9FE' },
                { label:'6 Ay Sonra', value:prediction.expected6Month, sub:'Tahmini net', color:'#92400E', bg:'#FEF3C7' },
              ].map(m=>(
                <div key={m.label} style={{ background:m.bg, borderRadius:'12px', padding:'12px 14px' }}>
                  <div style={{ fontSize:'11px', color:m.color, fontWeight:600, marginBottom:'3px' }}>{m.label}</div>
                  <div style={{ fontSize:'24px', fontWeight:800, color:m.color }}>{m.value}</div>
                  <div style={{ fontSize:'10px', color:'#7A8FA8', marginTop:'2px' }}>{m.sub}</div>
                </div>
              ))}
            </div>

            {prediction.goalProbabilities.length>0 && (
              <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'16px', marginBottom:'14px' }}>
                <div style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B', marginBottom:'12px' }}>Hedef Ulaşma Olasılığı</div>
                {prediction.goalProbabilities.map((g:any)=>{
                  const probColor = g.probability>=70?'#14532D':g.probability>=40?'#92400E':'#7F1D1D'
                  const probBg = g.probability>=70?'#DCFCE7':g.probability>=40?'#FEF3C7':'#FEF2F2'
                  return (
                    <div key={g.id} style={{ background:probBg, borderRadius:'10px', padding:'12px 14px', marginBottom:'10px', border:'1px solid rgba(0,0,0,0.06)' }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px', flexWrap:'wrap', gap:'8px' }}>
                        <div>
                          <div style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B' }}>{g.target_exam} — {g.target_score} puan</div>
                          <div style={{ fontSize:'11px', color:'#7A8FA8' }}>{g.months_left} ay kaldı · Aylık {g.needed_monthly} puan artış gerekli</div>
                        </div>
                        <div style={{ textAlign:'center' }}>
                          <div style={{ fontSize:'28px', fontWeight:800, color:probColor }}>%{g.probability}</div>
                          <div style={{ fontSize:'10px', color:'#7A8FA8' }}>olasılık</div>
                        </div>
                      </div>
                      <div style={{ height:'7px', background:'rgba(0,0,0,0.08)', borderRadius:'4px', overflow:'hidden' }}>
                        <div style={{ height:'100%', width:g.probability+'%', background:probColor, borderRadius:'4px' }} />
                      </div>
                      <div style={{ fontSize:'11px', color:probColor, fontWeight:600, marginTop:'6px' }}>
                        {g.probability>=70?'✓ Hedefe ulaşma yüksek ihtimalle mümkün':g.probability>=40?'⚠ Mevcut gidişle zor, ek çalışma gerekli':'✗ Ciddi müdahale gerekiyor'}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'16px', marginBottom:'14px' }}>
              <div style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B', marginBottom:'12px' }}>Ders Bazlı Projeksiyon (3 Ay)</div>
              {prediction.subjectForecasts.map((s:any)=>{
                const improved = s.projected>s.current
                return (
                  <div key={s.name} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 10px', borderRadius:'8px', background:'#F8FAFC', border:'1px solid #E2E8F0', marginBottom:'6px', flexWrap:'wrap' }}>
                    <div style={{ minWidth:'70px', fontSize:'12px', fontWeight:700, color:'#1B3A6B', flexShrink:0 }}>{s.name}</div>
                    <div style={{ flex:1, minWidth:'120px' }}>
                      <div style={{ display:'flex', gap:'6px', alignItems:'center', marginBottom:'4px' }}>
                        <div style={{ height:'5px', width:s.current+'%', background:'#E2E8F0', borderRadius:'3px' }} />
                        <span style={{ fontSize:'10px', color:'#7A8FA8' }}>%{s.current}</span>
                      </div>
                      <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
                        <div style={{ height:'5px', width:s.projected+'%', background:improved?'#2E7D52':'#C0392B', borderRadius:'3px' }} />
                        <span style={{ fontSize:'10px', color:improved?'#14532D':'#7F1D1D', fontWeight:600 }}>%{s.projected}</span>
                      </div>
                    </div>
                    <div style={{ textAlign:'center', flexShrink:0 }}>
                      <span style={{ fontSize:'15px', fontWeight:800, color:improved?'#14532D':'#7F1D1D' }}>{improved?'+':''}{s.projected-s.current}</span>
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{ background:'#EDE9FE', border:'1px solid #C4B5FD', borderRadius:'12px', padding:'16px' }}>
              <div style={{ fontSize:'13px', fontWeight:700, color:'#4C1D95', marginBottom:'8px' }}>AI Gelişim Tahmini</div>
              {aiPrediction ? (
                <div style={{ fontSize:'13px', color:'#374151', lineHeight:1.8, whiteSpace:'pre-wrap' }}>{aiPrediction}</div>
              ) : (
                <button onClick={getAiPrediction} disabled={aiLoading} style={{ padding:'9px 18px', borderRadius:'8px', background:'#6B4FC8', color:'#fff', fontSize:'13px', fontWeight:600, border:'none', cursor:'pointer' }}>
                  {aiLoading?'AI Hesaplıyor...':'AI ile Gelişim Tahmini Yap'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}