'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

function getMasteryColor(score: number) {
  if (score >= 80) return { bg:'#DCFCE7', text:'#14532D', border:'#86EFAC', label:'Uzman' }
  if (score >= 60) return { bg:'#EEF3FB', text:'#1B3A6B', border:'#BFDBFE', label:'İyi' }
  if (score >= 40) return { bg:'#FEF3C7', text:'#92400E', border:'#FCD34D', label:'Gelişiyor' }
  return { bg:'#FEF2F2', text:'#7F1D1D', border:'#FECACA', label:'Zayıf' }
}

export default function PerformancePage() {
  const [students, setStudents] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [selectedSubject, setSelectedSubject] = useState<any>(null)
  const [topicPerf, setTopicPerf] = useState<any[]>([])
  const [attempts, setAttempts] = useState<any[]>([])
  const [aiInsight, setAiInsight] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('map')
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: s }, { data: sub }] = await Promise.all([
      supabase.from('profiles').select('*').eq('role', 'student').order('full_name'),
      supabase.from('subjects').select('*').order('name'),
    ])
    setStudents(s??[]); setSubjects(sub??[]); setLoading(false)
  }

  async function selectStudent(s: any) {
    setSelectedStudent(s); setSelectedSubject(null); setAttempts([]); setAiInsight('')
    const { data } = await supabase.from('student_topic_performance').select('*, topics(name), subjects(name, color, id)').eq('student_id', s.id).order('mastery_score', { ascending:false })
    setTopicPerf(data??[])
  }

  async function selectSubject(s: any) {
    setSelectedSubject(s)
    if (!selectedStudent) return
    const { data } = await supabase.from('student_question_attempts').select('*, topics(name), subjects(name)').eq('student_id', selectedStudent.id).eq('subject_id', s.id).order('attempt_date', { ascending:false }).limit(30)
    setAttempts(data??[])
  }

  async function getAiInsight() {
    if (!selectedStudent||topicPerf.length===0) return
    setAiLoading(true); setAiInsight('')
    const weak = topicPerf.filter(t=>t.accuracy_rate<50).map(t=>t.subjects?.name+'-'+t.topics?.name+'(%'+Math.round(t.accuracy_rate)+'%)').join(', ')
    const strong = topicPerf.filter(t=>t.accuracy_rate>=70).map(t=>t.topics?.name).join(', ')
    const totalQ = topicPerf.reduce((s,t)=>s+t.total_questions,0)
    const totalC = topicPerf.reduce((s,t)=>s+t.correct_count,0)
    try {
      const res = await fetch('/api/ai/insight', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ student_name:selectedStudent.full_name, overall_rate:totalQ>0?Math.round(totalC/totalQ*100):0, weak_topics:weak||'Yok', strong_topics:strong||'Yok', total_questions:totalQ }) })
      const d = await res.json(); setAiInsight(d.insight??'')
    } catch { setAiInsight('AI analizi alınamadı.') }
    setAiLoading(false)
  }

  const totalQuestions = topicPerf.reduce((s,t)=>s+t.total_questions,0)
  const totalCorrect = topicPerf.reduce((s,t)=>s+t.correct_count,0)
  const totalWrong = topicPerf.reduce((s,t)=>s+t.wrong_count,0)
  const overallRate = totalQuestions>0 ? Math.round(totalCorrect/totalQuestions*100) : 0
  const weakCount = topicPerf.filter(t=>t.accuracy_rate<50).length
  const strongCount = topicPerf.filter(t=>t.accuracy_rate>=70).length

  const subjectGroups = topicPerf.reduce((acc:any,t)=>{
    const name = t.subjects?.name??'Diğer'
    if (!acc[name]) acc[name] = { topics:[], color:t.subjects?.color??'#1B3A6B' }
    acc[name].topics.push(t); return acc
  }, {})

  if (loading) return <div style={{ padding:'40px', textAlign:'center', color:'#7A8FA8' }}>Yükleniyor...</div>

  return (
    <div className="admin-page">
      <div style={{ marginBottom:'20px' }}>
        <h1>Hakimiyet Haritası</h1>
        <p style={{ fontSize:'12px', color:'#7A8FA8', margin:'3px 0 0' }}>Konu bazlı performans ve soru çözüm analizi</p>
      </div>

      {/* Mobil dropdown */}
      <div className="sidebar-dropdown">
        <select value={selectedStudent?.id??''} onChange={e=>{ const s=students.find(x=>x.id===e.target.value); if(s) selectStudent(s) }}>
          <option value="">Öğrenci seçin...</option>
          {students.map(s=><option key={s.id} value={s.id}>{s.full_name}</option>)}
        </select>
      </div>

      <div className="sidebar-layout">
        {/* Sol: öğrenci listesi */}
        <div className="sidebar-list">
          <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', overflow:'hidden' }}>
            <div style={{ padding:'12px 16px', borderBottom:'1px solid #F1F5F9', fontSize:'12.5px', fontWeight:700, color:'#1B3A6B' }}>
              Öğrenci Seç ({students.length})
            </div>
            <div style={{ maxHeight:'340px', overflowY:'auto' }}>
              {students.map(s=>(
                <div key={s.id} onClick={()=>selectStudent(s)} style={{ padding:'10px 16px', borderBottom:'1px solid #F8FAFC', cursor:'pointer', display:'flex', alignItems:'center', gap:'10px', background:selectedStudent?.id===s.id?'#F5F8FF':'#fff', borderLeft:selectedStudent?.id===s.id?'3px solid #1B3A6B':'3px solid transparent' }}>
                  <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:selectedStudent?.id===s.id?'#1B3A6B':'#EEF3FB', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:700, color:selectedStudent?.id===s.id?'#fff':'#1B3A6B', flexShrink:0 }}>
                    {s.full_name?.split(' ').map((n:string)=>n[0]).join('').slice(0,2)}
                  </div>
                  <span style={{ fontSize:'12.5px', fontWeight:selectedStudent?.id===s.id?700:500, color:'#1B3A6B' }}>{s.full_name}</span>
                </div>
              ))}
            </div>
          </div>

          {selectedStudent&&topicPerf.length>0 && (
            <div style={{ marginTop:'10px', background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'12px' }}>
              <div style={{ fontSize:'12px', fontWeight:700, color:'#1B3A6B', marginBottom:'8px' }}>Genel Özet</div>
              {[
                { label:'Toplam Soru', value:totalQuestions, color:'#1B3A6B' },
                { label:'Doğru', value:totalCorrect, color:'#14532D' },
                { label:'Yanlış', value:totalWrong, color:'#7F1D1D' },
                { label:'Başarı', value:'%'+overallRate, color:overallRate>=70?'#14532D':overallRate>=50?'#92400E':'#7F1D1D' },
                { label:'Zayıf Konu', value:weakCount, color:'#7F1D1D' },
                { label:'Güçlü Konu', value:strongCount, color:'#14532D' },
              ].map(m=>(
                <div key={m.label} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:'1px solid #F8FAFC', fontSize:'12px' }}>
                  <span style={{ color:'#7A8FA8' }}>{m.label}</span>
                  <span style={{ fontWeight:700, color:m.color }}>{m.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sağ panel */}
        <div>
          {!selectedStudent ? (
            <div style={{ background:'#F8FAFC', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'48px', textAlign:'center' }}>
              <div style={{ fontSize:'14px', color:'#7A8FA8' }}>Öğrenci seçin</div>
            </div>
          ) : topicPerf.length===0 ? (
            <div style={{ background:'#FEF3C7', border:'1px solid #FCD34D', borderRadius:'12px', padding:'40px', textAlign:'center' }}>
              <div style={{ fontSize:'14px', color:'#92400E' }}>Henüz soru çözüm verisi yok</div>
            </div>
          ) : (
            <>
              {/* Mobil özet */}
              <div style={{ background:'#fff', borderRadius:'10px', border:'1px solid #E2E8F0', padding:'12px', marginBottom:'12px', display:'flex', gap:'8px', flexWrap:'wrap' }} className="perf-mob-summary">
                {[
                  { label:'Soru', value:totalQuestions, color:'#1B3A6B' },
                  { label:'Doğru', value:totalCorrect, color:'#14532D' },
                  { label:'Başarı', value:'%'+overallRate, color:overallRate>=70?'#14532D':overallRate>=50?'#92400E':'#7F1D1D' },
                  { label:'Zayıf', value:weakCount, color:'#7F1D1D' },
                ].map(m=>(
                  <div key={m.label} style={{ flex:1, minWidth:'56px', textAlign:'center', padding:'6px', background:'#F8FAFC', borderRadius:'8px' }}>
                    <div style={{ fontSize:'16px', fontWeight:800, color:m.color }}>{m.value}</div>
                    <div style={{ fontSize:'10px', color:'#7A8FA8' }}>{m.label}</div>
                  </div>
                ))}
              </div>

              {/* Tab bar */}
              <div style={{ display:'flex', gap:'4px', marginBottom:'14px', background:'#F1F5F9', borderRadius:'10px', padding:'4px' }}>
                {[{ id:'map', label:'Hakimiyet' }, { id:'trend', label:'Soru Geçmişi' }, { id:'ai', label:'AI Analizi' }].map(tab=>(
                  <button key={tab.id} onClick={()=>setActiveTab(tab.id)} style={{ flex:1, padding:'8px 4px', borderRadius:'7px', border:'none', cursor:'pointer', background:activeTab===tab.id?'#fff':'transparent', color:activeTab===tab.id?'#1B3A6B':'#7A8FA8', fontSize:'12px', fontWeight:activeTab===tab.id?700:500 }}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* HAKİMİYET HARİTASI */}
              {activeTab === 'map' && (
                <div>
                  {Object.entries(subjectGroups).map(([sName, sData]: [string, any])=>(
                    <div key={sName} style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', overflow:'hidden', marginBottom:'12px' }}>
                      <div style={{ height:'3px', background:sData.color }} />
                      <div style={{ padding:'10px 14px', borderBottom:'1px solid #F1F5F9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <span style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B' }}>{sName}</span>
                        <span style={{ fontSize:'11px', color:'#7A8FA8' }}>{sData.topics.length} konu</span>
                      </div>
                      <div style={{ padding:'12px', display:'grid', gap:'8px' }} className="topics-grid">
                        {sData.topics.map((t:any)=>{
                          const mc = getMasteryColor(t.mastery_score)
                          const pct = Math.min(Math.round(t.accuracy_rate),100)
                          return (
                            <div key={t.id} style={{ background:mc.bg, borderRadius:'10px', padding:'10px 12px', border:'1px solid '+mc.border }}>
                              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
                                <span style={{ fontSize:'12.5px', fontWeight:700, color:mc.text }}>{t.topics?.name}</span>
                                <span style={{ fontSize:'10px', fontWeight:700, padding:'1px 6px', borderRadius:'8px', background:'rgba(255,255,255,0.7)', color:mc.text }}>{mc.label}</span>
                              </div>
                              <div style={{ height:'5px', background:'rgba(0,0,0,0.08)', borderRadius:'3px', overflow:'hidden', marginBottom:'6px' }}>
                                <div style={{ height:'100%', width:pct+'%', background:mc.text, borderRadius:'3px' }} />
                              </div>
                              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'11px', color:mc.text, marginBottom:'5px' }}>
                                <span>%{pct}</span>
                                <span>{t.total_questions} soru</span>
                              </div>
                              <div style={{ display:'flex', gap:'4px' }}>
                                <span style={{ fontSize:'10px', padding:'1px 5px', borderRadius:'6px', background:'#DCFCE7', color:'#14532D' }}>D:{t.correct_count}</span>
                                <span style={{ fontSize:'10px', padding:'1px 5px', borderRadius:'6px', background:'#FEF2F2', color:'#7F1D1D' }}>Y:{t.wrong_count}</span>
                                <span style={{ fontSize:'10px', padding:'1px 5px', borderRadius:'6px', background:'#F1F5F9', color:'#475569' }}>B:{t.blank_count}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* SORU GEÇMİŞİ */}
              {activeTab === 'trend' && (
                <div>
                  <div style={{ display:'flex', gap:'6px', marginBottom:'12px', flexWrap:'wrap' }}>
                    {subjects.filter(s=>topicPerf.some(t=>t.subject_id===s.id)).map(s=>(
                      <button key={s.id} onClick={()=>selectSubject(s)} style={{ padding:'6px 12px', borderRadius:'20px', border:'1.5px solid', cursor:'pointer', fontSize:'12px', fontWeight:600, background:selectedSubject?.id===s.id?s.color:'#fff', color:selectedSubject?.id===s.id?'#fff':'#475569', borderColor:selectedSubject?.id===s.id?s.color:'#E2E8F0' }}>
                        {s.name}
                      </button>
                    ))}
                  </div>
                  {attempts.length===0 ? (
                    <div style={{ background:'#F8FAFC', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'32px', textAlign:'center', color:'#7A8FA8', fontSize:'13px' }}>Ders seçin</div>
                  ) : (
                    <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', overflow:'hidden' }}>
                      {attempts.map((a,i)=>{
                        const rate = a.total_questions>0 ? Math.round(a.correct_count/a.total_questions*100) : 0
                        return (
                          <div key={a.id} style={{ padding:'11px 14px', borderBottom:i<attempts.length-1?'1px solid #F8FAFC':'none', display:'flex', alignItems:'center', gap:'10px' }}>
                            <div style={{ width:'40px', height:'40px', borderRadius:'9px', background:rate>=70?'#DCFCE7':rate>=50?'#FEF3C7':'#FEF2F2', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:800, color:rate>=70?'#14532D':rate>=50?'#92400E':'#7F1D1D', flexShrink:0 }}>
                              %{rate}
                            </div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontSize:'12.5px', fontWeight:600, color:'#1B3A6B', marginBottom:'2px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{a.topics?.name??'Genel'} — {a.difficulty_level}</div>
                              <div style={{ display:'flex', gap:'8px', fontSize:'11px' }}>
                                <span style={{ color:'#14532D' }}>D:{a.correct_count}</span>
                                <span style={{ color:'#7F1D1D' }}>Y:{a.wrong_count}</span>
                                <span style={{ color:'#7A8FA8' }}>B:{a.blank_count}</span>
                                <span style={{ color:'#7A8FA8' }}>T:{a.total_questions}</span>
                              </div>
                            </div>
                            <div style={{ fontSize:'11px', color:'#94A3B8', flexShrink:0 }}>{new Date(a.attempt_date).toLocaleDateString('tr-TR')}</div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* AI ANALİZİ */}
              {activeTab === 'ai' && (
                <div>
                  <div style={{ background:'#EDE9FE', border:'1px solid #C4B5FD', borderRadius:'12px', padding:'16px', marginBottom:'14px' }}>
                    <div style={{ fontSize:'13px', fontWeight:700, color:'#4C1D95', marginBottom:'8px' }}>AI Akademik Analiz</div>
                    <button onClick={getAiInsight} disabled={aiLoading} style={{ padding:'9px 18px', borderRadius:'8px', background:'#6B4FC8', color:'#fff', fontSize:'13px', fontWeight:600, border:'none', cursor:'pointer' }}>
                      {aiLoading?'Analiz Yapılıyor...':'AI Analizini Başlat'}
                    </button>
                  </div>
                  {aiInsight && (
                    <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'16px', marginBottom:'12px' }}>
                      <div style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B', marginBottom:'10px' }}>Analiz Sonucu</div>
                      <div style={{ fontSize:'13px', color:'#374151', lineHeight:1.8, whiteSpace:'pre-wrap' }}>{aiInsight}</div>
                    </div>
                  )}
                  <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'14px' }}>
                    <div style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B', marginBottom:'10px' }}>Risk Alanları</div>
                    {topicPerf.filter(t=>t.accuracy_rate<50).length===0 ? (
                      <div style={{ fontSize:'12.5px', color:'#14532D' }}>Kritik risk alanı yok!</div>
                    ) : topicPerf.filter(t=>t.accuracy_rate<50).map(t=>(
                      <div key={t.id} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'8px 0', borderBottom:'1px solid #F8FAFC' }}>
                        <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#C0392B', flexShrink:0 }} />
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:'12.5px', fontWeight:600, color:'#1B3A6B' }}>{t.subjects?.name} — {t.topics?.name}</div>
                          <div style={{ fontSize:'11px', color:'#7A8FA8' }}>{t.total_questions} soru — %{Math.round(t.accuracy_rate)} başarı</div>
                        </div>
                        <span style={{ fontSize:'11px', fontWeight:700, padding:'2px 8px', borderRadius:'20px', background:'#FEF2F2', color:'#7F1D1D' }}>Risk</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        .perf-mob-summary { display: flex; }
        .topics-grid { grid-template-columns: 1fr; }
        @media (min-width: 768px) {
          .perf-mob-summary { display: none; }
          .topics-grid { grid-template-columns: repeat(auto-fill, minmax(200px,1fr)); }
        }
      `}</style>
    </div>
  )
}