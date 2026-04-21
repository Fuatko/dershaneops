'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function CoordinatorPage() {
  const [students, setStudents] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [topicPerf, setTopicPerf] = useState<any[]>([])
  const [examResults, setExamResults] = useState<any[]>([])
  const [homework, setHomework] = useState<any[]>([])
  const [studyPlan, setStudyPlan] = useState<any>(null)
  const [riskScore, setRiskScore] = useState(0)
  const [aiInsight, setAiInsight] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [note, setNote] = useState('')
  const supabase = createClient()
  const DAYS = ['','Pzt','Sal','Çar','Per','Cum','Cmt','Paz']

  useEffect(() => { load() }, [])

  async function load() {
    const { data: s } = await supabase.from('profiles').select('id, full_name, created_at').eq('role', 'student').order('full_name')
    setStudents(s??[]); setLoading(false)
  }

  async function selectStudent(s: any) {
    setSelected(s); setAiInsight(''); setNote('')
    const [{ data: tp }, { data: hw }, { data: sp }, { data: risk }, { data: er }] = await Promise.all([
      supabase.from('student_topic_performance').select('*, topics(name), subjects(name, color)').eq('student_id', s.id).order('accuracy_rate', { ascending:true }),
      supabase.from('homework_assignments').select('*, tests(name, chapters(name, books(name)))').eq('student_id', s.id).order('created_at', { ascending:false }),
      supabase.from('study_plans').select('*, study_plan_items(*, subjects(name), topics(name))').eq('student_id', s.id).eq('status', 'active').order('created_at', { ascending:false }).limit(1).single(),
      supabase.rpc('calculate_risk_score', { p_student_id:s.id }),
      supabase.from('exam_results').select('*, exams(name, exam_date, exam_type), subjects(name)').eq('student_id', s.id).order('created_at', { ascending:false }),
    ])
    setTopicPerf(tp??[]); setHomework(hw??[]); setStudyPlan(sp); setRiskScore(risk??0); setExamResults(er??[])
  }

  async function getAiInsight() {
    if (!selected) return
    setAiLoading(true); setAiInsight('')
    const totalQ = topicPerf.reduce((s,t)=>s+t.total_questions,0)
    const totalC = topicPerf.reduce((s,t)=>s+t.correct_count,0)
    const overallRate = totalQ>0 ? Math.round(totalC/totalQ*100) : 0
    const weakTopics = topicPerf.filter(t=>t.accuracy_rate<50).map(t=>t.subjects?.name+'-'+t.topics?.name).join(', ')
    const strongTopics = topicPerf.filter(t=>t.accuracy_rate>=70).map(t=>t.topics?.name).join(', ')
    try {
      const res = await fetch('/api/ai/insight', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ student_name:selected.full_name, overall_rate:overallRate, weak_topics:weakTopics||'Yok', strong_topics:strongTopics||'Yok', total_questions:totalQ }) })
      const d = await res.json(); setAiInsight(d.insight??'')
    } catch { setAiInsight('AI analizi alınamadı.') }
    setAiLoading(false)
  }

  const totalQ = topicPerf.reduce((s,t)=>s+t.total_questions,0)
  const totalC = topicPerf.reduce((s,t)=>s+t.correct_count,0)
  const overallRate = totalQ>0 ? Math.round(totalC/totalQ*100) : 0
  const completedHw = homework.filter(h=>h.status==='completed').length
  const weakTopics = topicPerf.filter(t=>t.accuracy_rate<50)
  const strongTopics = topicPerf.filter(t=>t.accuracy_rate>=70)

  function getRisk(score: number) {
    if (score>=70) return { label:'Kritik', color:'#7F1D1D', bg:'#FEF2F2' }
    if (score>=45) return { label:'Yüksek', color:'#92400E', bg:'#FEF3C7' }
    if (score>=20) return { label:'Orta', color:'#1B3A6B', bg:'#EEF3FB' }
    return { label:'İyi', color:'#14532D', bg:'#DCFCE7' }
  }
  const rl = getRisk(riskScore)

  if (loading) return <div style={{ padding:'40px', textAlign:'center', color:'#7A8FA8' }}>Yükleniyor...</div>

  return (
    <div className="admin-page">
      <div style={{ marginBottom:'20px' }}>
        <h1>Akademik Koordinatör Paneli</h1>
        <p style={{ fontSize:'12px', color:'#7A8FA8', margin:'3px 0 0' }}>Öğrenci bazlı kapsamlı akademik izleme ve yönlendirme</p>
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
            <div style={{ padding:'12px 16px', borderBottom:'1px solid #F1F5F9', fontSize:'12.5px', fontWeight:700, color:'#1B3A6B' }}>Öğrenciler ({students.length})</div>
            <div style={{ maxHeight:'500px', overflowY:'auto' }}>
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
            <div style={{ fontSize:'14px', color:'#7A8FA8' }}>Sol panelden öğrenci seçin</div>
          </div>
        ) : (
          <div>
            {/* Başlık */}
            <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'16px', marginBottom:'12px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'12px', flexWrap:'wrap', marginBottom:'14px' }}>
                <div style={{ width:'44px', height:'44px', borderRadius:'50%', background:'#1B3A6B', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'15px', fontWeight:700, color:'#fff', flexShrink:0 }}>
                  {selected.full_name?.split(' ').map((n:string)=>n[0]).join('').slice(0,2)}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:'15px', fontWeight:700, color:'#1B3A6B' }}>{selected.full_name}</div>
                  <div style={{ fontSize:'11px', color:'#7A8FA8' }}>Kayıt: {new Date(selected.created_at).toLocaleDateString('tr-TR')}</div>
                </div>
                <button onClick={getAiInsight} disabled={aiLoading} style={{ padding:'8px 14px', borderRadius:'8px', background:'#6B4FC8', color:'#fff', fontSize:'12px', fontWeight:600, border:'none', cursor:'pointer', whiteSpace:'nowrap' }}>
                  {aiLoading?'AI...':'AI Analiz'}
                </button>
              </div>
              <div className="metrics-row" style={{ marginBottom:0 }}>
                {[
                  { label:'Başarı', value:'%'+overallRate, color:overallRate>=70?'#14532D':overallRate>=50?'#92400E':'#7F1D1D' },
                  { label:'Risk', value:rl.label, color:rl.color },
                  { label:'Soru', value:totalQ, color:'#1B3A6B' },
                  { label:'Ödev', value:completedHw+'/'+homework.length, color:'#4C1D95' },
                  { label:'Deneme', value:[...new Set(examResults.map(e=>e.exam_id))].length, color:'#92400E' },
                ].map(m=>(
                  <div key={m.label} style={{ background:'#F8FAFC', borderRadius:'8px', padding:'8px', textAlign:'center', border:'1px solid #E2E8F0' }}>
                    <div style={{ fontSize:'10px', color:'#7A8FA8', marginBottom:'2px' }}>{m.label}</div>
                    <div style={{ fontSize:'15px', fontWeight:700, color:m.color }}>{m.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display:'flex', gap:'4px', marginBottom:'12px', background:'#F1F5F9', borderRadius:'10px', padding:'4px', overflowX:'auto' }}>
              {[{ id:'overview', label:'Genel' }, { id:'topics', label:'Konular' }, { id:'exams', label:'Denemeler' }, { id:'plan', label:'Plan' }, { id:'ai', label:'AI' }].map(tab=>(
                <button key={tab.id} onClick={()=>setActiveTab(tab.id)} style={{ flex:1, minWidth:'60px', padding:'7px', borderRadius:'7px', border:'none', cursor:'pointer', background:activeTab===tab.id?'#fff':'transparent', color:activeTab===tab.id?'#1B3A6B':'#7A8FA8', fontSize:'12px', fontWeight:activeTab===tab.id?700:500, whiteSpace:'nowrap' }}>
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'overview' && (
              <div className="two-col">
                <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'14px' }}>
                  <div style={{ fontSize:'13px', fontWeight:700, color:'#7F1D1D', marginBottom:'10px' }}>Zayıf Konular ({weakTopics.length})</div>
                  {weakTopics.length===0 ? <div style={{ fontSize:'12px', color:'#14532D' }}>Kritik alan yok!</div> : weakTopics.slice(0,5).map(t=>(
                    <div key={t.id} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:'1px solid #F8FAFC', fontSize:'12px' }}>
                      <span style={{ color:'#374151' }}>{t.subjects?.name} — {t.topics?.name}</span>
                      <span style={{ fontWeight:700, color:'#7F1D1D' }}>%{Math.round(t.accuracy_rate)}</span>
                    </div>
                  ))}
                </div>
                <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'14px' }}>
                  <div style={{ fontSize:'13px', fontWeight:700, color:'#14532D', marginBottom:'10px' }}>Güçlü Konular ({strongTopics.length})</div>
                  {strongTopics.length===0 ? <div style={{ fontSize:'12px', color:'#7A8FA8' }}>Henüz veri yok</div> : strongTopics.slice(0,5).map(t=>(
                    <div key={t.id} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:'1px solid #F8FAFC', fontSize:'12px' }}>
                      <span style={{ color:'#374151' }}>{t.subjects?.name} — {t.topics?.name}</span>
                      <span style={{ fontWeight:700, color:'#14532D' }}>%{Math.round(t.accuracy_rate)}</span>
                    </div>
                  ))}
                </div>
                <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'14px' }}>
                  <div style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B', marginBottom:'10px' }}>Son Ödevler</div>
                  {homework.slice(0,5).map((h,i)=>(
                    <div key={h.id} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'6px 0', borderBottom:i<4?'1px solid #F8FAFC':'none', fontSize:'12px' }}>
                      <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:h.status==='completed'?'#2E7D52':'#B45309', flexShrink:0 }} />
                      <span style={{ flex:1, color:'#374151', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{h.tests?.name}</span>
                      <span style={{ fontSize:'10px', fontWeight:600, padding:'1px 6px', borderRadius:'8px', background:h.status==='completed'?'#DCFCE7':'#FEF3C7', color:h.status==='completed'?'#14532D':'#92400E', flexShrink:0 }}>
                        {h.status==='completed'?'Tamam':'Bekliyor'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'topics' && (
              <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'14px' }}>
                <div style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B', marginBottom:'12px' }}>Konu Hakimiyet Haritası</div>
                {topicPerf.length===0 ? <div style={{ fontSize:'12px', color:'#7A8FA8' }}>Henüz veri yok</div>
                : topicPerf.map(t=>{
                  const color = t.accuracy_rate>=70?'#14532D':t.accuracy_rate>=50?'#92400E':'#7F1D1D'
                  const bg = t.accuracy_rate>=70?'#DCFCE7':t.accuracy_rate>=50?'#FEF3C7':'#FEF2F2'
                  return (
                    <div key={t.id} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'8px', borderRadius:'8px', background:bg, marginBottom:'5px', flexWrap:'wrap' }}>
                      <div style={{ minWidth:'120px', flexShrink:0 }}>
                        <div style={{ fontSize:'12px', fontWeight:600, color }}>{t.topics?.name??'Genel'}</div>
                        <div style={{ fontSize:'10px', color:'#7A8FA8' }}>{t.subjects?.name}</div>
                      </div>
                      <div style={{ flex:1, minWidth:'80px', height:'6px', background:'rgba(0,0,0,0.08)', borderRadius:'3px', overflow:'hidden' }}>
                        <div style={{ height:'100%', width:Math.min(t.accuracy_rate,100)+'%', background:color, borderRadius:'3px' }} />
                      </div>
                      <span style={{ fontSize:'13px', fontWeight:800, color, flexShrink:0 }}>%{Math.round(t.accuracy_rate)}</span>
                    </div>
                  )
                })}
              </div>
            )}

            {activeTab === 'exams' && (
              <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', overflow:'hidden' }}>
                <div style={{ padding:'12px 16px', borderBottom:'1px solid #F1F5F9', fontSize:'13px', fontWeight:700, color:'#1B3A6B' }}>Deneme Sınavı Sonuçları</div>
                {examResults.length===0 ? (
                  <div style={{ padding:'32px', textAlign:'center', color:'#7A8FA8', fontSize:'13px' }}>Henüz deneme sonucu yok</div>
                ) : (()=>{
                  const grouped = examResults.reduce((acc:any,r:any)=>{
                    const key = r.exam_id
                    if (!acc[key]) acc[key]={ exam:r.exams, subjects:[], totalNet:0 }
                    acc[key].subjects.push(r); acc[key].totalNet+=r.net; return acc
                  }, {})
                  return Object.values(grouped).map((g:any,i:number)=>(
                    <div key={i} style={{ padding:'12px 16px', borderBottom:'1px solid #F8FAFC' }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px', flexWrap:'wrap', gap:'8px' }}>
                        <div>
                          <div style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B' }}>{g.exam?.name}</div>
                          <div style={{ fontSize:'11px', color:'#7A8FA8' }}>{new Date(g.exam?.exam_date).toLocaleDateString('tr-TR')} · {g.exam?.exam_type?.toUpperCase()}</div>
                        </div>
                        <div style={{ textAlign:'center' }}>
                          <div style={{ fontSize:'20px', fontWeight:800, color:'#1B3A6B' }}>{Math.round(g.totalNet*100)/100}</div>
                          <div style={{ fontSize:'10px', color:'#7A8FA8' }}>Toplam Net</div>
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
                        {g.subjects.map((s:any)=>(
                          <div key={s.id} style={{ background:'#F1F5F9', borderRadius:'7px', padding:'5px 10px', textAlign:'center' }}>
                            <div style={{ fontSize:'10px', color:'#7A8FA8' }}>{s.subjects?.name}</div>
                            <div style={{ fontSize:'13px', fontWeight:700, color:s.net>=0?'#1B3A6B':'#7F1D1D' }}>{s.net}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                })()}
              </div>
            )}

            {activeTab === 'plan' && (
              <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', overflow:'hidden' }}>
                <div style={{ padding:'12px 16px', borderBottom:'1px solid #F1F5F9', fontSize:'13px', fontWeight:700, color:'#1B3A6B' }}>Aktif Çalışma Planı</div>
                {!studyPlan ? (
                  <div style={{ padding:'32px', textAlign:'center' }}>
                    <div style={{ fontSize:'13px', color:'#7A8FA8', marginBottom:'10px' }}>Çalışma planı yok</div>
                    <a href="/studyplan" style={{ padding:'8px 16px', borderRadius:'8px', background:'#1B3A6B', color:'#fff', fontSize:'12.5px', fontWeight:600, textDecoration:'none' }}>Plan Oluştur →</a>
                  </div>
                ) : studyPlan.study_plan_items?.map((item:any,i:number)=>(
                  <div key={item.id} style={{ padding:'10px 16px', borderBottom:'1px solid #F8FAFC', display:'flex', alignItems:'center', gap:'10px' }}>
                    <div style={{ width:'30px', height:'20px', borderRadius:'4px', background:'#EEF3FB', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'9px', fontWeight:700, color:'#1B3A6B', flexShrink:0 }}>
                      {DAYS[item.day_of_week]}
                    </div>
                    <div style={{ flex:1, fontSize:'12px', color:'#374151' }}>{item.subjects?.name} — {item.topics?.name}</div>
                    <span style={{ fontSize:'10px', color:'#7A8FA8' }}>{item.question_count}s·{item.target_duration_minutes}dk</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'ai' && (
              <div>
                <div style={{ background:'#EDE9FE', border:'1px solid #C4B5FD', borderRadius:'12px', padding:'16px', marginBottom:'12px' }}>
                  <div style={{ fontSize:'13px', fontWeight:700, color:'#4C1D95', marginBottom:'8px' }}>AI Akademik Analiz</div>
                  {aiInsight ? (
                    <div style={{ fontSize:'13px', color:'#374151', lineHeight:1.8, whiteSpace:'pre-wrap' }}>{aiInsight}</div>
                  ) : (
                    <button onClick={getAiInsight} disabled={aiLoading} style={{ padding:'9px 18px', borderRadius:'8px', background:'#6B4FC8', color:'#fff', fontSize:'13px', fontWeight:600, border:'none', cursor:'pointer' }}>
                      {aiLoading?'Analiz Yapılıyor...':'AI Analizini Başlat'}
                    </button>
                  )}
                </div>
                <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'14px' }}>
                  <div style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B', marginBottom:'10px' }}>Koordinatör Notu</div>
                  <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Bu öğrenci için koordinatör notunuzu girin..." rows={4}
                    style={{ width:'100%', padding:'10px 12px', borderRadius:'8px', border:'1px solid #E2E8F0', fontSize:'13px', color:'#1B3A6B', outline:'none', resize:'vertical', boxSizing:'border-box', fontFamily:'inherit' }} />
                  <button disabled={!note} style={{ marginTop:'10px', padding:'9px 18px', borderRadius:'8px', background:note?'#1B3A6B':'#E2E8F0', color:'#fff', fontSize:'12.5px', fontWeight:600, border:'none', cursor:'pointer' }}>
                    Notu Kaydet
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}