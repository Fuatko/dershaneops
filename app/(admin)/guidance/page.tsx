'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function GuidancePage() {
  const [students, setStudents] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [riskData, setRiskData] = useState<any[]>([])
  const [attendance, setAttendance] = useState<any[]>([])
  const [topicPerf, setTopicPerf] = useState<any[]>([])
  const [homework, setHomework] = useState<any[]>([])
  const [streak, setStreak] = useState<any>(null)
  const [lessons, setLessons] = useState<any[]>([])
  const [goals, setGoals] = useState<any[]>([])
  const [riskScore, setRiskScore] = useState(0)
  const [aiGuidance, setAiGuidance] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('risk')
  const [attendanceForm, setAttendanceForm] = useState({ lesson_id:'', status:'absent', notes:'' })
  const [savingAttendance, setSavingAttendance] = useState(false)
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const { data: s } = await supabase.from('profiles').select('id, full_name, created_at').eq('role', 'student').order('full_name')
    setStudents(s??[])
    const riskList = []
    for (const st of (s??[]).slice(0,20)) {
      const { data: risk } = await supabase.rpc('calculate_risk_score', { p_student_id:st.id })
      const { data: tp } = await supabase.from('student_topic_performance').select('accuracy_rate').eq('student_id', st.id)
      const { data: hw } = await supabase.from('homework_assignments').select('status').eq('student_id', st.id)
      const { data: str } = await supabase.from('student_streaks').select('current_streak').eq('student_id', st.id).single()
      const avgRate = tp&&tp.length>0 ? Math.round(tp.reduce((a,t)=>a+t.accuracy_rate,0)/tp.length) : 0
      const hwRate = hw&&hw.length>0 ? Math.round(hw.filter(h=>h.status==='completed').length/hw.length*100) : 0
      riskList.push({ ...st, risk_score:Math.round(risk??0), avg_rate:avgRate, hw_rate:hwRate, streak:str?.current_streak??0 })
    }
    riskList.sort((a,b)=>b.risk_score-a.risk_score)
    setRiskData(riskList); setLoading(false)
  }

  async function selectStudent(s: any) {
    setSelected(s); setAiGuidance('')
    const [{ data: tp }, { data: hw }, { data: l }, { data: g }, { data: risk }, { data: str }] = await Promise.all([
      supabase.from('student_topic_performance').select('*, topics(name), subjects(name)').eq('student_id', s.id).order('accuracy_rate', { ascending:true }),
      supabase.from('homework_assignments').select('status, created_at').eq('student_id', s.id),
      supabase.from('lessons').select('*, profiles!lessons_teacher_id_fkey(full_name)').eq('student_id', s.id).order('scheduled_at', { ascending:false }).limit(20),
      supabase.from('student_goals').select('*').eq('student_id', s.id).eq('status', 'active'),
      supabase.rpc('calculate_risk_score', { p_student_id:s.id }),
      supabase.from('student_streaks').select('*').eq('student_id', s.id).single(),
    ])
    setTopicPerf(tp??[]); setHomework(hw??[]); setLessons(l??[]); setGoals(g??[]); setRiskScore(risk??0); setStreak(str)
    const { data: att } = await supabase.from('attendance').select('*, lessons(subject, scheduled_at)').eq('student_id', s.id).order('date', { ascending:false })
    setAttendance(att??[])
  }

  async function saveAttendance(e: React.FormEvent) {
    e.preventDefault(); if (!selected||!attendanceForm.lesson_id) { alert('Ders seçin!'); return }
    setSavingAttendance(true)
    const { error } = await supabase.from('attendance').upsert({ tenant_id:'61cb6e2f-98d6-4fe7-a1c3-3afdfa7a728f', student_id:selected.id, lesson_id:attendanceForm.lesson_id, date:new Date().toISOString().slice(0,10), status:attendanceForm.status, notes:attendanceForm.notes||null }, { onConflict:'student_id,lesson_id' })
    if (error) { alert('Hata: '+error.message); setSavingAttendance(false); return }
    const { data: att } = await supabase.from('attendance').select('id, date, status, notes, lesson_id').eq('student_id', selected.id).order('date', { ascending:false })
    const enriched = []
    for (const a of att??[]) {
      const { data: l } = await supabase.from('lessons').select('subject, scheduled_at').eq('id', a.lesson_id).single()
      enriched.push({ ...a, lessons:l })
    }
    setAttendance(enriched); setAttendanceForm(p=>({ ...p, lesson_id:'', notes:'' })); setSavingAttendance(false)
  }

  async function getAiGuidance() {
    if (!selected) return
    setAiLoading(true); setAiGuidance('')
    const totalQ = topicPerf.reduce((s,t)=>s+t.total_questions,0)
    const totalC = topicPerf.reduce((s,t)=>s+t.correct_count,0)
    const overallRate = totalQ>0 ? Math.round(totalC/totalQ*100) : 0
    const completedHw = homework.filter(h=>h.status==='completed').length
    const hwRate = homework.length>0 ? Math.round(completedHw/homework.length*100) : 0
    const absentCount = attendance.filter(a=>a.status==='absent').length
    const weakTopics = topicPerf.filter(t=>t.accuracy_rate<50).map(t=>t.subjects?.name+'-'+t.topics?.name).slice(0,3).join(', ')
    try {
      const res = await fetch('/api/ai/guidance', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ student_name:selected.full_name, overall_rate:overallRate, risk_score:Math.round(riskScore), hw_rate:hwRate, streak:streak?.current_streak??0, absent_count:absentCount, weak_topics:weakTopics||'Yok', goals:goals.map(g=>g.target_exam+' '+g.target_score).join(', ')||'Belirsiz' }) })
      const d = await res.json(); setAiGuidance(d.guidance??'')
    } catch { setAiGuidance('AI rehberlik raporu alınamadı.') }
    setAiLoading(false)
  }

  const totalQ = topicPerf.reduce((s,t)=>s+t.total_questions,0)
  const totalC = topicPerf.reduce((s,t)=>s+t.correct_count,0)
  const overallRate = totalQ>0 ? Math.round(totalC/totalQ*100) : 0
  const completedHw = homework.filter(h=>h.status==='completed').length
  const hwRate = homework.length>0 ? Math.round(completedHw/homework.length*100) : 0
  const absentCount = attendance.filter(a=>a.status==='absent').length
  const riskVal = Math.round(riskScore)

  const inpStyle: React.CSSProperties = { width:'100%', padding:'8px 10px', borderRadius:'7px', border:'1px solid #E2E8F0', fontSize:'12.5px', color:'#1B3A6B', outline:'none', background:'#fff', boxSizing:'border-box' }

  const TABS = [
    { id:'risk', label:'Risk Paneli' },
    { id:'profile', label:'Profil' },
    { id:'attendance', label:'Devamsızlık' },
    { id:'guidance', label:'Rehberlik' },
  ]

  function printGuidanceReport() {
    if (!selected) return
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><title>${selected.full_name} — Rehberlik Raporu</title>
<style>body{font-family:Arial,sans-serif;color:#1B3A6B;padding:20px}.header{background:#1B3A6B;padding:16px;color:#fff;margin-bottom:20px}.no-print{position:fixed;top:10px;right:10px}button{padding:8px 16px;background:#1B3A6B;color:#fff;border:none;border-radius:6px;cursor:pointer;margin-right:6px}@media print{.no-print{display:none}}</style></head><body>
<div class="no-print"><button onclick="window.print()">Yazdır</button><button onclick="window.close()">Kapat</button></div>
<div class="header"><h2>${selected.full_name} — Rehberlik Raporu</h2><p>${new Date().toLocaleDateString('tr-TR')}</p></div>
<p><strong>Genel Başarı:</strong> %${overallRate} | <strong>Risk:</strong> ${riskVal}/100 | <strong>Ödev:</strong> %${hwRate} | <strong>Devamsızlık:</strong> ${absentCount}</p>
${aiGuidance?`<h3>AI Rehberlik Önerileri</h3><p style="line-height:1.8;white-space:pre-wrap">${aiGuidance}</p>`:''}
</body></html>`)
    win.document.close()
  }

  if (loading) return <div style={{ padding:'40px', textAlign:'center', color:'#7A8FA8' }}>Yükleniyor...</div>

  return (
    <div className="admin-page">
      <div style={{ marginBottom:'20px' }}>
        <h1>Rehberlik Modülü</h1>
        <p style={{ fontSize:'12px', color:'#7A8FA8', margin:'3px 0 0' }}>Risk analizi, devamsızlık takibi ve AI rehberlik önerileri</p>
      </div>

      <div style={{ display:'flex', gap:'4px', marginBottom:'16px', background:'#F1F5F9', borderRadius:'10px', padding:'4px', overflowX:'auto' }}>
        {TABS.map(tab=>(
          <button key={tab.id} onClick={()=>setActiveTab(tab.id)} style={{ flex:1, minWidth:'70px', padding:'8px', borderRadius:'7px', border:'none', cursor:'pointer', background:activeTab===tab.id?'#fff':'transparent', color:activeTab===tab.id?'#1B3A6B':'#7A8FA8', fontSize:'12px', fontWeight:activeTab===tab.id?700:500, whiteSpace:'nowrap' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* RİSK PANELİ */}
      {activeTab === 'risk' && (
        <div>
          <div className="metrics-row">
            {[
              { label:'Kritik Risk (70+)', value:riskData.filter(s=>s.risk_score>=70).length, color:'#7F1D1D', bg:'#FEF2F2' },
              { label:'Yüksek Risk (45-70)', value:riskData.filter(s=>s.risk_score>=45&&s.risk_score<70).length, color:'#92400E', bg:'#FEF3C7' },
              { label:'Orta Risk (20-45)', value:riskData.filter(s=>s.risk_score>=20&&s.risk_score<45).length, color:'#1B3A6B', bg:'#EEF3FB' },
              { label:'Düşük Risk (0-20)', value:riskData.filter(s=>s.risk_score<20).length, color:'#14532D', bg:'#DCFCE7' },
            ].map(m=>(
              <div key={m.label} style={{ background:m.bg, borderRadius:'10px', padding:'12px 14px' }}>
                <div style={{ fontSize:'11px', color:m.color, fontWeight:600, marginBottom:'4px' }}>{m.label}</div>
                <div style={{ fontSize:'28px', fontWeight:800, color:m.color }}>{m.value}</div>
              </div>
            ))}
          </div>
          <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', overflow:'hidden' }}>
            <div style={{ padding:'12px 16px', borderBottom:'1px solid #F1F5F9', fontSize:'13px', fontWeight:700, color:'#1B3A6B' }}>
              Tüm Öğrenciler — Risk Sıralaması
            </div>
            {riskData.map((s,i)=>{
              const rl = s.risk_score>=70?{ color:'#7F1D1D', bg:'#FEF2F2', label:'Kritik' }:s.risk_score>=45?{ color:'#92400E', bg:'#FEF3C7', label:'Yüksek' }:s.risk_score>=20?{ color:'#1B3A6B', bg:'#EEF3FB', label:'Orta' }:{ color:'#14532D', bg:'#DCFCE7', label:'İyi' }
              return (
                <div key={s.id} onClick={()=>{ selectStudent(s); setActiveTab('profile') }} style={{ padding:'11px 16px', borderBottom:i<riskData.length-1?'1px solid #F8FAFC':'none', display:'flex', alignItems:'center', gap:'10px', cursor:'pointer', background:selected?.id===s.id?'#F5F8FF':'#fff', flexWrap:'wrap' }}>
                  <div style={{ fontSize:'11px', color:'#9CA3AF', fontWeight:600, width:'20px', flexShrink:0, textAlign:'center' }}>{i+1}</div>
                  <div style={{ width:'32px', height:'32px', borderRadius:'50%', background:'#EEF3FB', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:700, color:'#1B3A6B', flexShrink:0 }}>
                    {s.full_name?.split(' ').map((n:string)=>n[0]).join('').slice(0,2)}
                  </div>
                  <div style={{ flex:1, minWidth:'100px' }}>
                    <div style={{ fontSize:'12.5px', fontWeight:600, color:'#1B3A6B', marginBottom:'2px' }}>{s.full_name}</div>
                    <div style={{ fontSize:'11px', color:'#7A8FA8' }}>%{s.avg_rate} · ödev%{s.hw_rate} · {s.streak}gün</div>
                  </div>
                  <div style={{ textAlign:'center', flexShrink:0 }}>
                    <div style={{ fontSize:'20px', fontWeight:800, color:rl.color }}>{s.risk_score}</div>
                    <span style={{ fontSize:'10px', fontWeight:700, padding:'1px 6px', borderRadius:'8px', background:rl.bg, color:rl.color }}>{rl.label}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* PROFİL */}
      {activeTab === 'profile' && (
        <div>
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
                      <div style={{ width:'26px', height:'26px', borderRadius:'50%', background:selected?.id===s.id?'#1B3A6B':'#EEF3FB', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'9px', fontWeight:700, color:selected?.id===s.id?'#fff':'#1B3A6B', flexShrink:0 }}>
                        {s.full_name?.split(' ').map((n:string)=>n[0]).join('').slice(0,2)}
                      </div>
                      <span style={{ fontSize:'12px', fontWeight:selected?.id===s.id?700:500, color:'#1B3A6B' }}>{s.full_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {!selected ? (
              <div style={{ background:'#F8FAFC', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'48px', textAlign:'center' }}>
                <div style={{ fontSize:'14px', color:'#7A8FA8' }}>Öğrenci seçin</div>
              </div>
            ) : (
              <div>
                <div style={{ background:'#1B3A6B', borderRadius:'12px', padding:'16px 18px', marginBottom:'12px', display:'flex', alignItems:'center', gap:'14px', flexWrap:'wrap' }}>
                  <div style={{ width:'48px', height:'48px', borderRadius:'50%', background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', fontWeight:700, color:'#fff', flexShrink:0 }}>
                    {selected.full_name?.split(' ').map((n:string)=>n[0]).join('').slice(0,2)}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:'16px', fontWeight:800, color:'#fff' }}>{selected.full_name}</div>
                    <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.6)', marginTop:'2px' }}>Kayıt: {new Date(selected.created_at).toLocaleDateString('tr-TR')}</div>
                  </div>
                  <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
                    <button onClick={getAiGuidance} disabled={aiLoading} style={{ padding:'7px 12px', borderRadius:'7px', background:'#6B4FC8', color:'#fff', fontSize:'12px', fontWeight:600, border:'none', cursor:'pointer' }}>
                      {aiLoading?'AI...':'AI Rehberlik'}
                    </button>
                    <button onClick={printGuidanceReport} style={{ padding:'7px 12px', borderRadius:'7px', background:'rgba(255,255,255,0.15)', color:'#fff', fontSize:'12px', fontWeight:600, border:'none', cursor:'pointer' }}>
                      🖨️ PDF
                    </button>
                  </div>
                </div>

                <div className="metrics-row" style={{ marginBottom:'12px' }}>
                  {[
                    { label:'Başarı', value:'%'+overallRate, color:overallRate>=70?'#14532D':overallRate>=50?'#92400E':'#7F1D1D', bg:overallRate>=70?'#DCFCE7':'#FEF3C7' },
                    { label:'Risk', value:riskVal+'/100', color:riskVal>=70?'#7F1D1D':riskVal>=45?'#92400E':'#14532D', bg:riskVal>=70?'#FEF2F2':'#FEF3C7' },
                    { label:'Ödev', value:'%'+hwRate, color:'#4C1D95', bg:'#EDE9FE' },
                    { label:'Devamsız', value:absentCount, color:absentCount>=5?'#7F1D1D':'#1B3A6B', bg:absentCount>=5?'#FEF2F2':'#EEF3FB' },
                    { label:'Seri', value:streak?.current_streak??0, color:'#92400E', bg:'#FEF3C7' },
                  ].map(m=>(
                    <div key={m.label} style={{ background:m.bg, borderRadius:'8px', padding:'10px', textAlign:'center' }}>
                      <div style={{ fontSize:'18px', fontWeight:800, color:m.color }}>{m.value}</div>
                      <div style={{ fontSize:'10px', color:'#7A8FA8', marginTop:'2px' }}>{m.label}</div>
                    </div>
                  ))}
                </div>

                <div className="two-col" style={{ marginBottom:'12px' }}>
                  <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'12px', padding:'12px' }}>
                    <div style={{ fontSize:'12px', fontWeight:700, color:'#7F1D1D', marginBottom:'8px' }}>⚠ Zayıf Konular</div>
                    {topicPerf.filter(t=>t.accuracy_rate<50).length===0 ? <div style={{ fontSize:'12px', color:'#14532D', fontWeight:600 }}>Kritik alan yok!</div>
                    : topicPerf.filter(t=>t.accuracy_rate<50).slice(0,4).map(t=>(
                      <div key={t.id} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:'1px solid rgba(0,0,0,0.05)', fontSize:'12px' }}>
                        <span style={{ color:'#374151', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.subjects?.name} — {t.topics?.name??'Genel'}</span>
                        <strong style={{ color:'#7F1D1D', flexShrink:0, marginLeft:'6px' }}>%{Math.round(t.accuracy_rate)}</strong>
                      </div>
                    ))}
                  </div>
                  <div style={{ background:'#DCFCE7', border:'1px solid #86EFAC', borderRadius:'12px', padding:'12px' }}>
                    <div style={{ fontSize:'12px', fontWeight:700, color:'#14532D', marginBottom:'8px' }}>✓ Güçlü Konular</div>
                    {topicPerf.filter(t=>t.accuracy_rate>=70).length===0 ? <div style={{ fontSize:'12px', color:'#7A8FA8' }}>Henüz veri yok</div>
                    : topicPerf.filter(t=>t.accuracy_rate>=70).slice(0,4).map(t=>(
                      <div key={t.id} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:'1px solid rgba(0,0,0,0.05)', fontSize:'12px' }}>
                        <span style={{ color:'#374151', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.subjects?.name} — {t.topics?.name??'Genel'}</span>
                        <strong style={{ color:'#14532D', flexShrink:0, marginLeft:'6px' }}>%{Math.round(t.accuracy_rate)}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                {aiGuidance && (
                  <div style={{ background:'#EEF3FB', border:'1px solid #BFDBFE', borderRadius:'12px', padding:'16px' }}>
                    <div style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B', marginBottom:'10px' }}>🧭 AI Rehberlik Önerileri</div>
                    <div style={{ fontSize:'13px', color:'#374151', lineHeight:1.8, whiteSpace:'pre-wrap' }}>{aiGuidance}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* DEVAMSIZLIK */}
      {activeTab === 'attendance' && (
        <div>
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
                {students.map(s=>(
                  <div key={s.id} onClick={()=>selectStudent(s)} style={{ padding:'9px 16px', borderBottom:'1px solid #F8FAFC', cursor:'pointer', display:'flex', alignItems:'center', gap:'8px', background:selected?.id===s.id?'#F5F8FF':'#fff', borderLeft:selected?.id===s.id?'3px solid #1B3A6B':'3px solid transparent' }}>
                    <div style={{ width:'24px', height:'24px', borderRadius:'50%', background:selected?.id===s.id?'#1B3A6B':'#EEF3FB', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'9px', fontWeight:700, color:selected?.id===s.id?'#fff':'#1B3A6B', flexShrink:0 }}>
                      {s.full_name?.split(' ').map((n:string)=>n[0]).join('').slice(0,2)}
                    </div>
                    <span style={{ fontSize:'12px', fontWeight:selected?.id===s.id?700:500, color:'#1B3A6B' }}>{s.full_name}</span>
                  </div>
                ))}
              </div>
            </div>

            {!selected ? (
              <div style={{ background:'#F8FAFC', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'48px', textAlign:'center' }}>
                <div style={{ fontSize:'14px', color:'#7A8FA8' }}>Öğrenci seçin</div>
              </div>
            ) : (
              <div>
                <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'16px', marginBottom:'12px' }}>
                  <div style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B', marginBottom:'12px' }}>Devamsızlık Kaydet — {selected.full_name}</div>
                  <form onSubmit={saveAttendance}>
                    <div className="grid-3" style={{ marginBottom:'12px' }}>
                      <div>
                        <label style={{ display:'block', fontSize:'11px', fontWeight:600, color:'#475569', marginBottom:'4px', textTransform:'uppercase' }}>Ders *</label>
                        <select value={attendanceForm.lesson_id} onChange={e=>setAttendanceForm(p=>({...p,lesson_id:e.target.value}))} style={{ ...inpStyle }} required>
                          <option value="">Ders seçin...</option>
                          {lessons.map(l=><option key={l.id} value={l.id}>{l.subject} — {new Date(l.scheduled_at).toLocaleDateString('tr-TR')}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ display:'block', fontSize:'11px', fontWeight:600, color:'#475569', marginBottom:'4px', textTransform:'uppercase' }}>Durum</label>
                        <select value={attendanceForm.status} onChange={e=>setAttendanceForm(p=>({...p,status:e.target.value}))} style={{ ...inpStyle }}>
                          <option value="present">Katıldı</option>
                          <option value="absent">Gelmedi</option>
                          <option value="late">Geç Geldi</option>
                          <option value="excused">Mazeretli</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display:'block', fontSize:'11px', fontWeight:600, color:'#475569', marginBottom:'4px', textTransform:'uppercase' }}>Not</label>
                        <input value={attendanceForm.notes} onChange={e=>setAttendanceForm(p=>({...p,notes:e.target.value}))} placeholder="Açıklama..." style={{ ...inpStyle }} />
                      </div>
                    </div>
                    <button type="submit" disabled={savingAttendance} style={{ padding:'9px 20px', borderRadius:'8px', background:'#1B3A6B', color:'#fff', fontSize:'13px', fontWeight:600, border:'none', cursor:'pointer' }}>
                      {savingAttendance?'Kaydediliyor...':'Kaydet'}
                    </button>
                  </form>
                </div>

                <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E2E8F0', overflow:'hidden' }}>
                  <div style={{ padding:'12px 16px', borderBottom:'1px solid #F1F5F9', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'8px' }}>
                    <div style={{ fontSize:'13px', fontWeight:700, color:'#1B3A6B' }}>Devamsızlık Kayıtları</div>
                    <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
                      {[
                        { label:'Gelmedi', value:attendance.filter(a=>a.status==='absent').length, color:'#7F1D1D' },
                        { label:'Geç', value:attendance.filter(a=>a.status==='late').length, color:'#92400E' },
                        { label:'Mazeretli', value:attendance.filter(a=>a.status==='excused').length, color:'#4C1D95' },
                      ].map(m=>(
                        <span key={m.label} style={{ padding:'2px 8px', borderRadius:'8px', background:'#F1F5F9', color:m.color, fontWeight:700, fontSize:'11px' }}>
                          {m.label}: {m.value}
                        </span>
                      ))}
                    </div>
                  </div>
                  {attendance.length===0 ? (
                    <div style={{ padding:'28px', textAlign:'center', color:'#7A8FA8', fontSize:'13px' }}>Henüz kayıt yok</div>
                  ) : attendance.map((a,i)=>(
                    <div key={a.id} style={{ padding:'10px 16px', borderBottom:i<attendance.length-1?'1px solid #F8FAFC':'none', display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap' }}>
                      <div style={{ width:'9px', height:'9px', borderRadius:'50%', background:a.status==='present'?'#2E7D52':a.status==='absent'?'#C0392B':a.status==='late'?'#B45309':'#6B4FC8', flexShrink:0 }} />
                      <div style={{ flex:1, fontSize:'12.5px', color:'#374151' }}>
                        <strong>{a.lessons?.subject??'-'}</strong>
                        {a.notes&&<span style={{ color:'#7A8FA8', marginLeft:'6px', fontSize:'11px' }}>{a.notes}</span>}
                      </div>
                      <span style={{ fontSize:'11px', fontWeight:600, padding:'2px 7px', borderRadius:'7px', background:a.status==='present'?'#DCFCE7':a.status==='absent'?'#FEF2F2':a.status==='late'?'#FEF3C7':'#EDE9FE', color:a.status==='present'?'#14532D':a.status==='absent'?'#7F1D1D':a.status==='late'?'#92400E':'#4C1D95', flexShrink:0 }}>
                        {a.status==='present'?'Katıldı':a.status==='absent'?'Gelmedi':a.status==='late'?'Geç':'Mazeretli'}
                      </span>
                      <span style={{ fontSize:'11px', color:'#9CA3AF', flexShrink:0 }}>{new Date(a.date).toLocaleDateString('tr-TR')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REHBERLİK ÖNERİLERİ */}
      {activeTab === 'guidance' && (
        <div>
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
                {students.map(s=>(
                  <div key={s.id} onClick={()=>selectStudent(s)} style={{ padding:'9px 16px', borderBottom:'1px solid #F8FAFC', cursor:'pointer', display:'flex', alignItems:'center', gap:'8px', background:selected?.id===s.id?'#F5F8FF':'#fff', borderLeft:selected?.id===s.id?'3px solid #1B3A6B':'3px solid transparent' }}>
                    <div style={{ width:'24px', height:'24px', borderRadius:'50%', background:selected?.id===s.id?'#1B3A6B':'#EEF3FB', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'9px', fontWeight:700, color:selected?.id===s.id?'#fff':'#1B3A6B', flexShrink:0 }}>
                      {s.full_name?.split(' ').map((n:string)=>n[0]).join('').slice(0,2)}
                    </div>
                    <span style={{ fontSize:'12px', fontWeight:selected?.id===s.id?700:500, color:'#1B3A6B' }}>{s.full_name}</span>
                  </div>
                ))}
              </div>
            </div>

            {!selected ? (
              <div style={{ background:'#F8FAFC', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'48px', textAlign:'center' }}>
                <div style={{ fontSize:'36px', marginBottom:'10px' }}>🧭</div>
                <div style={{ fontSize:'14px', color:'#7A8FA8' }}>Öğrenci seçin</div>
              </div>
            ) : (
              <div>
                <div style={{ background:'#EEF3FB', border:'1px solid #BFDBFE', borderRadius:'12px', padding:'16px', marginBottom:'12px' }}>
                  <div style={{ fontSize:'14px', fontWeight:700, color:'#1B3A6B', marginBottom:'10px' }}>🧭 AI Rehberlik Önerileri — {selected.full_name}</div>
                  {aiGuidance ? (
                    <div style={{ fontSize:'13px', color:'#374151', lineHeight:1.9, whiteSpace:'pre-wrap' }}>{aiGuidance}</div>
                  ) : (
                    <button onClick={getAiGuidance} disabled={aiLoading} style={{ padding:'10px 18px', borderRadius:'8px', background:'#1B3A6B', color:'#fff', fontSize:'13px', fontWeight:600, border:'none', cursor:'pointer' }}>
                      {aiLoading?'AI Analiz Yapıyor...':'AI Rehberlik Raporu Oluştur'}
                    </button>
                  )}
                </div>
                {aiGuidance && (
                  <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                    <button onClick={printGuidanceReport} style={{ padding:'10px 18px', borderRadius:'9px', background:'#1B3A6B', color:'#fff', fontSize:'13px', fontWeight:600, border:'none', cursor:'pointer' }}>🖨️ PDF / Yazdır</button>
                    <button onClick={getAiGuidance} disabled={aiLoading} style={{ padding:'10px 18px', borderRadius:'9px', background:'#EEF3FB', color:'#1B3A6B', fontSize:'13px', fontWeight:600, border:'1px solid #BFDBFE', cursor:'pointer' }}>🔄 Yenile</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}