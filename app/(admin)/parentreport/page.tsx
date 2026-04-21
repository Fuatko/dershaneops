'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ParentReportPage() {
  const [students, setStudents] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [topicPerf, setTopicPerf] = useState<any[]>([])
  const [homework, setHomework] = useState<any[]>([])
  const [lessons, setLessons] = useState<any[]>([])
  const [riskVal, setRiskVal] = useState(0)
  const [aiReport, setAiReport] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('profiles').select('*').eq('role', 'student').order('full_name')
    setStudents(data??[]); setLoading(false)
  }

  async function selectStudent(s: any) {
    setSelected(s); setAiReport('')
    const [{ data: tp }, { data: hw }, { data: l }, { data: risk }] = await Promise.all([
      supabase.from('student_topic_performance').select('*, topics(name), subjects(name)').eq('student_id', s.id).order('accuracy_rate', { ascending:false }),
      supabase.from('homework_assignments').select('*').eq('student_id', s.id),
      supabase.from('lessons').select('*').eq('student_id', s.id),
      supabase.rpc('calculate_risk_score', { p_student_id:s.id }),
    ])
    setTopicPerf(tp??[]); setHomework(hw??[]); setLessons(l??[]); setRiskVal(risk??0)
  }

  async function getAiReport() {
    if (!selected) return
    setAiLoading(true); setAiReport('')
    const totalQ = topicPerf.reduce((s,t)=>s+t.total_questions,0)
    const totalC = topicPerf.reduce((s,t)=>s+t.correct_count,0)
    const overallRate = totalQ>0 ? Math.round(totalC/totalQ*100) : 0
    const strongTopics = topicPerf.filter(t=>t.accuracy_rate>=70).map(t=>t.subjects?.name+'-'+t.topics?.name).join(', ')
    const weakTopics = topicPerf.filter(t=>t.accuracy_rate<50).map(t=>t.subjects?.name+'-'+t.topics?.name+'(%'+Math.round(t.accuracy_rate)+'%)').join(', ')
    const completedHw = homework.filter(h=>h.status==='completed').length
    const completedL = lessons.filter(l=>l.status==='completed').length
    try {
      const res = await fetch('/api/ai/parentreport', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ student_name:selected.full_name, overall_rate:overallRate, risk_score:Math.round(riskVal), strong_topics:strongTopics||'Yok', weak_topics:weakTopics||'Yok', completed_homework:completedHw, total_homework:homework.length, completed_lessons:completedL, total_lessons:lessons.length }) })
      const d = await res.json(); setAiReport(d.report??'')
    } catch { setAiReport('Rapor oluşturulamadı.') }
    setAiLoading(false)
  }

  function printReport() { window.print() }

  const totalQ = topicPerf.reduce((s,t)=>s+t.total_questions,0)
  const totalC = topicPerf.reduce((s,t)=>s+t.correct_count,0)
  const overallRate = totalQ>0 ? Math.round(totalC/totalQ*100) : 0
  const completedHw = homework.filter(h=>h.status==='completed').length
  const completedLessons = lessons.filter(l=>l.status==='completed').length

  if (loading) return <div style={{ padding:'40px', textAlign:'center', color:'#7A8FA8' }}>Yükleniyor...</div>

  return (
    <div className="admin-page">
      <div style={{ marginBottom:'20px' }}>
        <h1>Veli Raporu</h1>
        <p style={{ fontSize:'12px', color:'#7A8FA8', margin:'3px 0 0' }}>Veliye özel AI yorumlu gelişim raporu</p>
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
            <div style={{ padding:'12px 16px', borderBottom:'1px solid #F1F5F9', fontSize:'12.5px', fontWeight:700, color:'#1B3A6B' }}>Öğrenci Seç</div>
            <div style={{ maxHeight:'400px', overflowY:'auto' }}>
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
            <div style={{ fontSize:'14px', color:'#7A8FA8' }}>Rapor için öğrenci seçin</div>
          </div>
        ) : (
          <div>
            <div className="metrics-row">
              {[
                { label:'Genel Başarı', value:'%'+overallRate, color:overallRate>=70?'#14532D':overallRate>=50?'#92400E':'#7F1D1D', bg:overallRate>=70?'#DCFCE7':'#FEF3C7' },
                { label:'Risk Skoru', value:Math.round(riskVal)+'/100', color:riskVal>=70?'#7F1D1D':riskVal>=45?'#92400E':'#14532D', bg:riskVal>=70?'#FEF2F2':'#FEF3C7' },
                { label:'Ödev', value:completedHw+'/'+homework.length, color:'#4C1D95', bg:'#EDE9FE' },
                { label:'Ders', value:completedLessons+'/'+lessons.length, color:'#1B3A6B', bg:'#EEF3FB' },
              ].map(m => (
                <div key={m.label} style={{ background:m.bg, borderRadius:'10px', padding:'12px 14px' }}>
                  <div style={{ fontSize:'11px', color:m.color, fontWeight:600, marginBottom:'3px' }}>{m.label}</div>
                  <div style={{ fontSize:'22px', fontWeight:800, color:m.color }}>{m.value}</div>
                </div>
              ))}
            </div>

            <div className="two-col" style={{ marginBottom:'14px' }}>
              <div style={{ background:'#DCFCE7', border:'1px solid #86EFAC', borderRadius:'12px', padding:'14px' }}>
                <div style={{ fontSize:'13px', fontWeight:700, color:'#14532D', marginBottom:'10px' }}>✓ Güçlü Konular</div>
                {topicPerf.filter(t=>t.accuracy_rate>=70).length===0 ? (
                  <div style={{ fontSize:'12px', color:'#7A8FA8' }}>Henüz veri yok</div>
                ) : topicPerf.filter(t=>t.accuracy_rate>=70).slice(0,5).map(t => (
                  <div key={t.id} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:'1px solid rgba(0,0,0,0.05)', fontSize:'12px' }}>
                    <span style={{ color:'#374151' }}>{t.subjects?.name} — {t.topics?.name??'Genel'}</span>
                    <strong style={{ color:'#14532D' }}>%{Math.round(t.accuracy_rate)}</strong>
                  </div>
                ))}
              </div>
              <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'12px', padding:'14px' }}>
                <div style={{ fontSize:'13px', fontWeight:700, color:'#7F1D1D', marginBottom:'10px' }}>⚠ Gelişim Alanları</div>
                {topicPerf.filter(t=>t.accuracy_rate<50).length===0 ? (
                  <div style={{ fontSize:'12px', color:'#14532D', fontWeight:600 }}>Kritik alan yok!</div>
                ) : topicPerf.filter(t=>t.accuracy_rate<50).slice(0,5).map(t => (
                  <div key={t.id} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:'1px solid rgba(0,0,0,0.05)', fontSize:'12px' }}>
                    <span style={{ color:'#374151' }}>{t.subjects?.name} — {t.topics?.name??'Genel'}</span>
                    <strong style={{ color:'#7F1D1D' }}>%{Math.round(t.accuracy_rate)}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background:'#EEF3FB', border:'1px solid #BFDBFE', borderRadius:'12px', padding:'16px', marginBottom:'14px' }}>
              <div style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B', marginBottom:'10px' }}>AI Veli Raporu</div>
              {aiReport ? (
                <div style={{ fontSize:'13px', color:'#374151', lineHeight:1.8, whiteSpace:'pre-wrap' }}>{aiReport}</div>
              ) : (
                <button onClick={getAiReport} disabled={aiLoading} style={{ padding:'9px 18px', borderRadius:'8px', background:'#1B3A6B', color:'#fff', fontSize:'13px', fontWeight:600, border:'none', cursor:'pointer' }}>
                  {aiLoading?'AI Rapor Hazırlıyor...':'AI ile Veli Raporu Oluştur'}
                </button>
              )}
            </div>

            <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
              <button onClick={printReport} style={{ padding:'10px 20px', borderRadius:'9px', background:'#1B3A6B', color:'#fff', fontSize:'13px', fontWeight:600, border:'none', cursor:'pointer' }}>
                🖨️ PDF / Yazdır
              </button>
              <button onClick={getAiReport} disabled={aiLoading} style={{ padding:'10px 20px', borderRadius:'9px', background:'#EEF3FB', color:'#1B3A6B', fontSize:'13px', fontWeight:600, border:'1px solid #BFDBFE', cursor:'pointer' }}>
                {aiLoading?'Hazırlanıyor...':'🔄 Raporu Yenile'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}