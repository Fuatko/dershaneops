'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

function getRisk(score: number) {
  if (score >= 70) return { label:'Kritik', color:'#C0392B', bg:'#FEF2F2' }
  if (score >= 45) return { label:'Yüksek', color:'#B45309', bg:'#FDF4E7' }
  if (score >= 20) return { label:'Orta', color:'#1B3A6B', bg:'#EEF3FB' }
  return { label:'Düşük', color:'#2E7D52', bg:'#DCFCE7' }
}

export default function TeacherDecisionPage() {
  const [teachers, setTeachers] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [studentData, setStudentData] = useState<any[]>([])
  const [aiAdvice, setAiAdvice] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('profiles').select('id, full_name').eq('role', 'teacher').order('full_name')
    setTeachers(data??[]); setLoading(false)
  }

  async function selectTeacher(t: any) {
    setSelected(t); setAiAdvice('')
    const { data: lessons } = await supabase.from('lessons').select('student_id, subject, profiles!lessons_student_id_fkey(full_name)').eq('teacher_id', t.id).eq('status', 'scheduled')
    const studentIds = [...new Set((lessons??[]).map((l:any)=>l.student_id))]
    const result = []
    for (const sid of studentIds) {
      const { data: riskData } = await supabase.rpc('calculate_risk_score', { p_student_id:sid })
      const { data: tp } = await supabase.from('student_topic_performance').select('accuracy_rate, total_questions, topics(name), subjects(name)').eq('student_id', sid).order('accuracy_rate', { ascending:true }).limit(5)
      const sLesson = (lessons??[]).find((l:any)=>l.student_id===sid)
      const totalQ = (tp??[]).reduce((s:number,x:any)=>s+x.total_questions,0)
      const totalC = (tp??[]).reduce((s:number,x:any)=>s+(x.total_questions*x.accuracy_rate/100),0)
      const overallRate = totalQ>0 ? Math.round(totalC/totalQ*100) : 0
      result.push({ id:sid, name:sLesson?.profiles?.full_name??'Bilinmiyor', subject:sLesson?.subject??'—', risk_score:riskData??0, overall_rate:overallRate, total_questions:totalQ, weak_topics:(tp??[]).filter((x:any)=>x.accuracy_rate<50) })
    }
    result.sort((a,b)=>b.risk_score-a.risk_score)
    setStudentData(result)
  }

  async function getAiAdvice() {
    if (!selected||studentData.length===0) return
    setAiLoading(true); setAiAdvice('')
    const summary = studentData.map(s=>({ name:s.name, risk:Math.round(s.risk_score), rate:s.overall_rate, weak:s.weak_topics.map((t:any)=>t.subjects?.name+'-'+t.topics?.name).join(', ') }))
    try {
      const res = await fetch('/api/ai/teacheradvice', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ teacher_name:selected.full_name, students:summary }) })
      const d = await res.json(); setAiAdvice(d.advice??'')
    } catch { setAiAdvice('AI önerisi alınamadı.') }
    setAiLoading(false)
  }

  if (loading) return <div style={{ padding:'40px', textAlign:'center', color:'#7A8FA8' }}>Yükleniyor...</div>

  return (
    <div style={{ padding:'20px 16px', maxWidth:'1200px' }}>
      <div style={{ marginBottom:'20px' }}>
        <h1 style={{ fontSize:'18px', fontWeight:700, color:'#1B3A6B', margin:0 }}>Öğretmen Karar Destek</h1>
        <p style={{ fontSize:'12px', color:'#7A8FA8', margin:'3px 0 0' }}>Öğretmen bazlı öğrenci risk analizi ve AI önerileri</p>
      </div>

      {/* Mobil dropdown */}
      <div className="td-mob">
        <select value={selected?.id??''} onChange={e => { const t=teachers.find(x=>x.id===e.target.value); if(t) selectTeacher(t) }}
          style={{ width:'100%', padding:'10px 12px', borderRadius:'8px', border:'1px solid #E2E8F0', fontSize:'13px', color:'#1B3A6B', background:'#fff', outline:'none' }}>
          <option value="">Öğretmen seçin...</option>
          {teachers.map(t=><option key={t.id} value={t.id}>{t.full_name}</option>)}
        </select>
      </div>

      <div className="td-layout">
        {/* Sol */}
        <div className="td-desk" style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', overflow:'hidden' }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid #F1F5F9', fontSize:'12.5px', fontWeight:700, color:'#1B3A6B' }}>Öğretmenler</div>
          {teachers.length===0 ? (
            <div style={{ padding:'20px', textAlign:'center', fontSize:'12px', color:'#7A8FA8' }}>Öğretmen yok</div>
          ) : teachers.map(t => (
            <div key={t.id} onClick={() => selectTeacher(t)} style={{ padding:'10px 16px', borderBottom:'1px solid #F8FAFC', cursor:'pointer', display:'flex', alignItems:'center', gap:'10px', background:selected?.id===t.id?'#F5F8FF':'#fff', borderLeft:selected?.id===t.id?'3px solid #1B3A6B':'3px solid transparent' }}>
              <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:selected?.id===t.id?'#1B3A6B':'#EEF3FB', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:700, color:selected?.id===t.id?'#fff':'#1B3A6B', flexShrink:0 }}>
                {t.full_name?.split(' ').map((n:string)=>n[0]).join('').slice(0,2)}
              </div>
              <span style={{ fontSize:'12.5px', fontWeight:selected?.id===t.id?700:500, color:'#1B3A6B' }}>{t.full_name}</span>
            </div>
          ))}
        </div>

        {/* Sağ */}
        {!selected ? (
          <div className="td-desk" style={{ background:'#F8FAFC', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'60px', textAlign:'center' }}>
            <div style={{ fontSize:'14px', color:'#7A8FA8' }}>Sol panelden öğretmen seçin</div>
          </div>
        ) : (
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px', flexWrap:'wrap', gap:'10px' }}>
              <div>
                <div style={{ fontSize:'15px', fontWeight:700, color:'#1B3A6B' }}>{selected.full_name}</div>
                <div style={{ fontSize:'12px', color:'#7A8FA8' }}>{studentData.length} aktif öğrenci</div>
              </div>
              <button onClick={getAiAdvice} disabled={aiLoading||studentData.length===0} style={{ padding:'9px 16px', borderRadius:'8px', background:'#6B4FC8', color:'#fff', fontSize:'12.5px', fontWeight:600, border:'none', cursor:'pointer' }}>
                {aiLoading?'AI Düşünüyor...':'AI Öğretmen Tavsiyesi'}
              </button>
            </div>

            {aiAdvice && (
              <div style={{ background:'#EDE9FE', border:'1px solid #C4B5FD', borderRadius:'12px', padding:'16px', marginBottom:'14px' }}>
                <div style={{ fontSize:'12.5px', fontWeight:700, color:'#6B4FC8', marginBottom:'8px' }}>AI Öğretmen Tavsiyesi</div>
                <div style={{ fontSize:'13px', color:'#374151', lineHeight:1.8, whiteSpace:'pre-wrap' }}>{aiAdvice}</div>
              </div>
            )}

            {studentData.length>0 && (
              <div className="td-metrics">
                {[
                  { label:'Toplam Öğrenci', value:studentData.length, color:'#1B3A6B', bg:'#EEF3FB' },
                  { label:'Kritik Risk', value:studentData.filter(s=>s.risk_score>=70).length, color:'#C0392B', bg:'#FEF2F2' },
                  { label:'Yüksek Risk', value:studentData.filter(s=>s.risk_score>=45&&s.risk_score<70).length, color:'#B45309', bg:'#FDF4E7' },
                  { label:'Ort. Başarı', value:'%'+(studentData.length>0?Math.round(studentData.reduce((s,x)=>s+x.overall_rate,0)/studentData.length):0), color:'#2E7D52', bg:'#DCFCE7' },
                ].map(m => (
                  <div key={m.label} style={{ background:m.bg, borderRadius:'10px', padding:'12px 14px' }}>
                    <div style={{ fontSize:'10.5px', color:m.color, fontWeight:600, marginBottom:'3px' }}>{m.label}</div>
                    <div style={{ fontSize:'22px', fontWeight:700, color:m.color }}>{m.value}</div>
                  </div>
                ))}
              </div>
            )}

            {studentData.length===0 ? (
              <div style={{ background:'#FEF3C7', border:'1px solid #FCD34D', borderRadius:'12px', padding:'32px', textAlign:'center' }}>
                <div style={{ fontSize:'13px', color:'#92400E' }}>Bu öğretmene atanmış aktif ders bulunamadı</div>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginTop:'14px' }}>
                {studentData.map(s => {
                  const rl = getRisk(s.risk_score)
                  return (
                    <div key={s.id} style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'14px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                        <div style={{ width:'38px', height:'38px', borderRadius:'50%', background:'#EEF3FB', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:700, color:'#1B3A6B', flexShrink:0 }}>
                          {s.name?.split(' ').map((n:string)=>n[0]).join('').slice(0,2)}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B', marginBottom:'2px' }}>{s.name}</div>
                          <div style={{ fontSize:'11px', color:'#7A8FA8' }}>{s.subject} · {s.total_questions} soru · %{s.overall_rate} başarı</div>
                        </div>
                        <div style={{ textAlign:'center', flexShrink:0 }}>
                          <div style={{ fontSize:'20px', fontWeight:800, color:rl.color }}>{Math.round(s.risk_score)}</div>
                          <span style={{ fontSize:'10px', fontWeight:700, padding:'1px 7px', borderRadius:'8px', background:rl.bg, color:rl.color }}>{rl.label}</span>
                        </div>
                      </div>
                      {s.weak_topics.length>0 && (
                        <div style={{ marginTop:'10px', paddingTop:'10px', borderTop:'1px solid #F1F5F9' }}>
                          <div style={{ fontSize:'11px', fontWeight:700, color:'#C0392B', marginBottom:'6px' }}>Zayıf Konular</div>
                          <div style={{ display:'flex', gap:'5px', flexWrap:'wrap' }}>
                            {s.weak_topics.slice(0,4).map((t:any,i:number) => (
                              <span key={i} style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'10px', background:'#FEF2F2', color:'#C0392B', border:'1px solid #FECACA' }}>
                                {t.subjects?.name} — {t.topics?.name} (%{Math.round(t.accuracy_rate)})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {s.total_questions===0 && (
                        <div style={{ marginTop:'8px', padding:'7px 10px', background:'#FEF3C7', borderRadius:'7px', fontSize:'12px', color:'#92400E' }}>
                          Henüz soru çözüm verisi yok
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .td-metrics { display:grid; gap:10px; margin-bottom:4px; grid-template-columns:repeat(2,1fr); }
        .td-layout { display:grid; gap:16px; grid-template-columns:1fr; }
        .td-mob { display:block; margin-bottom:12px; }
        .td-desk { display:none; }
        @media (min-width:768px) {
          .td-metrics { grid-template-columns:repeat(4,1fr); }
          .td-layout { grid-template-columns:240px 1fr; }
          .td-mob { display:none !important; }
          .td-desk { display:block !important; }
        }
      `}</style>
    </div>
  )
}