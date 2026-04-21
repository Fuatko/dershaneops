'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ProfilePage() {
  const [students, setStudents] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [topicPerf, setTopicPerf] = useState<any[]>([])
  const [attempts, setAttempts] = useState<any[]>([])
  const [lessons, setLessons] = useState<any[]>([])
  const [homework, setHomework] = useState<any[]>([])
  const [riskScore, setRiskScore] = useState(0)
  const [aiProfile, setAiProfile] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('profiles').select('*').eq('role', 'student').order('full_name')
    setStudents(data??[]); setLoading(false)
  }

  async function selectStudent(s: any) {
    setSelected(s); setAiProfile('')
    const [{ data: tp }, { data: att }, { data: l }, { data: hw }, { data: risk }] = await Promise.all([
      supabase.from('student_topic_performance').select('*, topics(name), subjects(name, color)').eq('student_id', s.id).order('mastery_score', { ascending:false }),
      supabase.from('student_question_attempts').select('*, subjects(name), topics(name)').eq('student_id', s.id).order('attempt_date', { ascending:false }).limit(20),
      supabase.from('lessons').select('*').eq('student_id', s.id).order('scheduled_at', { ascending:false }),
      supabase.from('homework_assignments').select('*').eq('student_id', s.id),
      supabase.rpc('calculate_risk_score', { p_student_id:s.id }),
    ])
    setTopicPerf(tp??[]); setAttempts(att??[]); setLessons(l??[]); setHomework(hw??[]); setRiskScore(risk??0)
  }

  async function generateAiProfile() {
    if (!selected) return
    setAiLoading(true); setAiProfile('')
    const totalQ = topicPerf.reduce((s,t)=>s+t.total_questions,0)
    const totalC = topicPerf.reduce((s,t)=>s+t.correct_count,0)
    const overallRate = totalQ>0 ? Math.round(totalC/totalQ*100) : 0
    const strongTopics = topicPerf.filter(t=>t.accuracy_rate>=70).map(t=>t.subjects?.name+'-'+t.topics?.name).join(', ')
    const weakTopics = topicPerf.filter(t=>t.accuracy_rate<50).map(t=>t.subjects?.name+'-'+t.topics?.name+'(%'+Math.round(t.accuracy_rate)+'%)').join(', ')
    const completedHw = homework.filter(h=>h.status==='completed').length
    const completedL = lessons.filter(l=>l.status==='completed').length
    try {
      const res = await fetch('/api/ai/devprofile', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ student_name:selected.full_name, overall_rate:overallRate, risk_score:Math.round(riskScore), strong_topics:strongTopics||'Yok', weak_topics:weakTopics||'Yok', total_questions:totalQ, trend_up:topicPerf.filter(t=>t.trend_direction==='up').length, trend_down:topicPerf.filter(t=>t.trend_direction==='down').length, completed_homework:completedHw, total_homework:homework.length, completed_lessons:completedL, total_lessons:lessons.length }) })
      const d = await res.json(); setAiProfile(d.profile??'')
    } catch { setAiProfile('Profil oluşturulamadı.') }
    setAiLoading(false)
  }

  const totalQ = topicPerf.reduce((s,t)=>s+t.total_questions,0)
  const totalC = topicPerf.reduce((s,t)=>s+t.correct_count,0)
  const totalW = topicPerf.reduce((s,t)=>s+t.wrong_count,0)
  const overallRate = totalQ>0 ? Math.round(totalC/totalQ*100) : 0
  const completedHw = homework.filter(h=>h.status==='completed').length
  const completedL = lessons.filter(l=>l.status==='completed').length

  function getRiskColor(score: number) {
    if (score>=70) return '#C0392B'; if (score>=45) return '#B45309'
    if (score>=20) return '#1B3A6B'; return '#2E7D52'
  }
  function getMasteryBg(rate: number) {
    if (rate>=80) return { bg:'#DCFCE7', text:'#14532D' }
    if (rate>=60) return { bg:'#EEF3FB', text:'#1B3A6B' }
    if (rate>=40) return { bg:'#FEF3C7', text:'#92400E' }
    return { bg:'#FEF2F2', text:'#7F1D1D' }
  }

  if (loading) return <div style={{ padding:'40px', textAlign:'center', color:'#7A8FA8' }}>Yükleniyor...</div>

  return (
    <div className="admin-page">
      <div style={{ marginBottom:'20px' }}>
        <h1>Akademik Gelişim Profili</h1>
        <p style={{ fontSize:'12px', color:'#7A8FA8', margin:'3px 0 0' }}>Öğrenci bazlı kapsamlı akademik profil ve gelişim analizi</p>
      </div>

      <div className="sidebar-dropdown">
        <select value={selected?.id??''} onChange={e => { const s=students.find(x=>x.id===e.target.value); if(s) selectStudent(s) }}>
          <option value="">Öğrenci seçin...</option>
          {students.map(s=><option key={s.id} value={s.id}>{s.full_name}</option>)}
        </select>
      </div>

      <div className="sidebar-layout">
        <div className="sidebar-list">
          <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', overflow:'hidden' }}>
            <div style={{ padding:'12px 16px', borderBottom:'1px solid #F1F5F9', fontSize:'12.5px', fontWeight:700, color:'#1B3A6B' }}>
              Öğrenci Seç ({students.length})
            </div>
            <div style={{ maxHeight:'360px', overflowY:'auto' }}>
              {students.map(s => (
                <div key={s.id} onClick={() => selectStudent(s)} style={{ padding:'10px 16px', borderBottom:'1px solid #F8FAFC', cursor:'pointer', display:'flex', alignItems:'center', gap:'10px', background:selected?.id===s.id?'#F5F8FF':'#fff', borderLeft:selected?.id===s.id?'3px solid #1B3A6B':'3px solid transparent' }}>
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
          <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            {/* Profil başlık */}
            <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'16px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'16px', flexWrap:'wrap' }}>
                <div style={{ width:'52px', height:'52px', borderRadius:'50%', background:'#1B3A6B', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', fontWeight:800, color:'#fff', flexShrink:0 }}>
                  {selected.full_name?.split(' ').map((n:string)=>n[0]).join('').slice(0,2)}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:'16px', fontWeight:800, color:'#1B3A6B' }}>{selected.full_name}</div>
                  <div style={{ fontSize:'12px', color:'#7A8FA8', marginTop:'2px' }}>Kayıt: {new Date(selected.created_at).toLocaleDateString('tr-TR')}</div>
                </div>
                <button onClick={generateAiProfile} disabled={aiLoading} style={{ padding:'9px 16px', borderRadius:'9px', background:'#6B4FC8', color:'#fff', fontSize:'13px', fontWeight:700, border:'none', cursor:'pointer', whiteSpace:'nowrap' }}>
                  {aiLoading?'AI Analiz...':'AI Profil'}
                </button>
              </div>
              <div className="metrics-row" style={{ marginBottom:0 }}>
                {[
                  { label:'Başarı', value:'%'+overallRate, color:overallRate>=70?'#14532D':overallRate>=50?'#92400E':'#7F1D1D', bg:overallRate>=70?'#DCFCE7':overallRate>=50?'#FEF3C7':'#FEF2F2' },
                  { label:'Risk', value:Math.round(riskScore), color:getRiskColor(riskScore), bg:riskScore>=70?'#FEF2F2':riskScore>=45?'#FEF3C7':'#DCFCE7' },
                  { label:'Ödev', value:completedHw+'/'+homework.length, color:'#4C1D95', bg:'#EDE9FE' },
                  { label:'Ders', value:completedL+'/'+lessons.length, color:'#92400E', bg:'#FEF3C7' },
                ].map(m => (
                  <div key={m.label} style={{ background:m.bg, borderRadius:'8px', padding:'10px', textAlign:'center' }}>
                    <div style={{ fontSize:'10px', color:m.color, fontWeight:600, marginBottom:'2px' }}>{m.label}</div>
                    <div style={{ fontSize:'18px', fontWeight:800, color:m.color }}>{m.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Profil */}
            {aiProfile && (
              <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #C4B5FD', padding:'18px' }}>
                <div style={{ fontSize:'13px', fontWeight:700, color:'#6B4FC8', marginBottom:'12px' }}>AI Akademik Gelişim Profili</div>
                <div style={{ fontSize:'13px', color:'#374151', lineHeight:1.9, whiteSpace:'pre-wrap' }}>{aiProfile}</div>
              </div>
            )}

            {/* SWOT */}
            {topicPerf.length>0 && (
              <div className="two-col">
                {[
                  { title:'💪 Güçlü Yönler', items:topicPerf.filter(t=>t.accuracy_rate>=70), color:'#14532D', bg:'#DCFCE7', border:'#86EFAC' },
                  { title:'⚠ Gelişim Alanları', items:topicPerf.filter(t=>t.accuracy_rate<50), color:'#7F1D1D', bg:'#FEF2F2', border:'#FECACA' },
                  { title:'🎯 Fırsatlar', items:topicPerf.filter(t=>t.accuracy_rate>=50&&t.accuracy_rate<70), color:'#92400E', bg:'#FEF3C7', border:'#FCD34D' },
                  { title:'⚡ Öncelikli Aksiyonlar', items:topicPerf.filter(t=>t.accuracy_rate<50).slice(0,3), color:'#4C1D95', bg:'#EDE9FE', border:'#C4B5FD' },
                ].map(box => (
                  <div key={box.title} style={{ background:box.bg, borderRadius:'12px', padding:'14px', border:'1px solid '+box.border }}>
                    <div style={{ fontSize:'13px', fontWeight:700, color:box.color, marginBottom:'10px' }}>{box.title}</div>
                    {box.items.length===0 ? (
                      <div style={{ fontSize:'12px', color:'#9CA3AF' }}>Bu kategoride konu yok</div>
                    ) : box.items.slice(0,4).map((t:any) => (
                      <div key={t.id} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:'1px solid rgba(0,0,0,0.05)', fontSize:'12px' }}>
                        <span style={{ color:'#374151' }}>{t.subjects?.name} — {t.topics?.name}</span>
                        <span style={{ fontWeight:700, color:box.color }}>%{Math.round(t.accuracy_rate)}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Hakimiyet haritası */}
            {topicPerf.length>0 && (
              <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'16px' }}>
                <div style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B', marginBottom:'12px' }}>Konu Hakimiyet Haritası</div>
                <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                  {topicPerf.map(t => {
                    const mc = getMasteryBg(t.accuracy_rate)
                    return (
                      <div key={t.id} style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                        <div style={{ minWidth:'120px', maxWidth:'160px', flexShrink:0 }}>
                          <div style={{ fontSize:'12px', fontWeight:600, color:'#1B3A6B', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{t.topics?.name}</div>
                          <div style={{ fontSize:'10px', color:'#7A8FA8' }}>{t.subjects?.name}</div>
                        </div>
                        <div style={{ flex:1, height:'6px', background:'#F1F5F9', borderRadius:'3px', overflow:'hidden' }}>
                          <div style={{ height:'100%', width:Math.min(t.accuracy_rate,100)+'%', background:mc.text, borderRadius:'3px' }} />
                        </div>
                        <div style={{ width:'50px', textAlign:'right', flexShrink:0 }}>
                          <span style={{ fontSize:'13px', fontWeight:800, color:mc.text }}>%{Math.round(t.accuracy_rate)}</span>
                          {t.trend_direction==='up'&&<span style={{ fontSize:'10px', color:'#2E7D52', marginLeft:'2px' }}>↑</span>}
                          {t.trend_direction==='down'&&<span style={{ fontSize:'10px', color:'#C0392B', marginLeft:'2px' }}>↓</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Son çalışmalar */}
            {attempts.length>0 && (
              <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', overflow:'hidden' }}>
                <div style={{ padding:'12px 16px', borderBottom:'1px solid #F1F5F9', fontSize:'13px', fontWeight:700, color:'#1B3A6B' }}>
                  Son Çalışmalar ({attempts.length})
                </div>
                {attempts.slice(0,8).map((a,i) => {
                  const rate = a.total_questions>0 ? Math.round(a.correct_count/a.total_questions*100) : 0
                  return (
                    <div key={a.id} style={{ padding:'10px 16px', borderBottom:i<7?'1px solid #F8FAFC':'none', display:'flex', alignItems:'center', gap:'10px' }}>
                      <div style={{ width:'36px', height:'36px', borderRadius:'8px', background:rate>=70?'#DCFCE7':rate>=50?'#FEF3C7':'#FEF2F2', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:800, color:rate>=70?'#14532D':rate>=50?'#92400E':'#7F1D1D', flexShrink:0 }}>
                        %{rate}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:'12.5px', fontWeight:600, color:'#1B3A6B', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{a.subjects?.name}{a.topics?.name?' — '+a.topics.name:''}</div>
                        <div style={{ fontSize:'11px', color:'#7A8FA8' }}>D:{a.correct_count} Y:{a.wrong_count} B:{a.blank_count} · {new Date(a.attempt_date).toLocaleDateString('tr-TR')}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}